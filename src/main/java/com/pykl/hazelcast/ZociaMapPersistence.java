/**
 * Copyright (c) 2012, Pykl Studios <admin@pykl.com>, All rights reserved.
 */
package com.pykl.hazelcast;

import com.hazelcast.core.HazelcastInstance;
import com.zocia.platform.hazelcast.persistence.MapPersistence;
import org.eclipse.jetty.client.Address;
import org.eclipse.jetty.client.ContentExchange;
import org.eclipse.jetty.client.HttpClient;
import org.eclipse.jetty.client.HttpExchange;
import org.eclipse.jetty.io.ByteArrayBuffer;
import org.eclipse.jetty.util.thread.QueuedThreadPool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.*;

public class ZociaMapPersistence implements MapPersistence {

    // Constants -------------------------------------------------------------------

    private static final Logger LOG = LoggerFactory.getLogger(ZociaMapPersistence.class);

    // Instances -------------------------------------------------------------------

    protected String _access = "ro";
    protected HttpClient _client;
    protected Address _zociaAddress;
    protected String _zociaAddressString;
    protected String _index;
    protected String _type;


    // Constructors ----------------------------------------------------------------

    public ZociaMapPersistence() {
        LOG.debug("Initializing ZociaMapPersistence instance.");
        try {
            _client = new HttpClient();
            _client.setConnectorType(HttpClient.CONNECTOR_SELECT_CHANNEL);
            _client.setMaxConnectionsPerAddress(5); // max 200 concurrent connections to every address
            _client.setThreadPool(new QueuedThreadPool(5)); // max 250 threads
            _client.setTimeout(10000); // 10 seconds timeout; if no server reply, the request expires
            _client.start();
        } catch (Exception e) {
            LOG.error("Failed to establish HTTP connection client to Zocia.", e);
        }
    }


    // Protecteds ------------------------------------------------------------------

    protected String[] mapParts(String mapName) {
        String[] parts = mapName.split("-");
        if (parts.length != 2) {
            throw new IllegalArgumentException("The Hazelcast map name must be in the format <index>-<type>.");
        }

        return parts;
    }

    // Properties ------------------------------------------------------------------

    public void setZociaUrl(String zociaUrl) {
        String[] parts = zociaUrl.split(":");
        if (parts.length == 1) {
            _zociaAddress = new Address(zociaUrl, 80);
        } else {
            _zociaAddress = new Address(parts[0], Integer.parseInt(parts[1]));
        }
        _zociaAddressString = _zociaAddress.toString();
    }

// MapLoaderLifecycleSupport ---------------------------------------------------

    /**
     * Initializes this MapLoader implementation. Hazelcast will call
     * this method when the map is first used on the
     * HazelcastInstance. Implementation can
     * initialize required resources for the implementing
     * mapLoader such as reading a config file and/or creating
     * database connection.
     *
     * @param hazelcastInstance HazelcastInstance of this mapLoader.
     * @param properties        Properties set for this mapStore. see MapStoreConfig
     * @param mapName           name of the map.
     */
    public void init(HazelcastInstance hazelcastInstance, Properties properties, String mapName) {
        if (LOG.isInfoEnabled()) {
            LOG.info("Initializing the ES persistence for map {}. Additional props: {}",
                    mapName, properties.toString());
        }

        String access = properties.getProperty("access");
        if (access != null) {
            if (!access.equals("ro") && !access.equals("rw") && !access.equals("all")) {
                String s = "ZociaMapPersistence configuration of \"access\" property must be either ro, rw, or all";
                LOG.error(s);
                throw new IllegalArgumentException(s);
            }
        }

        final String[] parts = mapParts(mapName);
        _index = parts[0];
        _type = parts[1];
    }

    /**
     * Hazelcast will call this method before shutting down.
     * This method can be overridden to cleanup the resources
     * held by this map loader implementation, such as closing the
     * database connections etc.
     */
    public void destroy() {
        try {
            _client.stop();
        } catch (Exception e) {
            LOG.error("Failure attempting to stop HTTP client.", e);
        }
    }


    // MapStore Implementation -----------------------------------------------------


    /**
     * Deletes the entry with a given key from the store.
     *
     * @param key key to delete from the store.
     */
    public void delete(Object key) {
        if (_access.equalsIgnoreCase("ro") || _access.equalsIgnoreCase("rw")) {
            LOG.warn(String.format("Permission error while deleting document, " +
                    "index [%s], type [%s], key [%s], access [%s]",
                    _index, _type, key, _access));
            return;
        }

        if (LOG.isDebugEnabled()) {
            LOG.debug("Deleting document, index [{}], type [{}], key [{}]",
                    new Object[]{_index, _type, key});
        }

        HttpExchange exchange = new MyExchange(_index, _type, key, _zociaAddressString) {
            @Override
            protected void onResponseComplete() throws IOException {
                if (this.getResponseStatus() % 100 == 2) return;
                super.onResponseComplete();
            }
        };
        exchange.setMethod("DELETE");
        exchange.setAddress(_zociaAddress);

        try {
            _client.send(exchange);
        } catch (IOException e) {
            LOG.warn("Failed to delete, index [{}], type [[]], key [{}]",
                    new Object[]{_index, _type, key}, e);
        }
    }

    /**
     * Deletes multiple entries from the store.
     *
     * @param keys keys of the entries to delete.
     */
    public void deleteAll(Collection keys) {
        for (Object key : keys) {
            delete(key);
        }
    }

    /**
     * Stores multiple entries. Implementation of this method can optimize the
     * store operation by storing all entries in one database connection for instance.
     * <p/>
     *
     * @param map map of entries to store
     */
    public void storeAll(Map map) {
        for (Object item : map.entrySet()) {
            Map.Entry entry = (Map.Entry) item;
            store(entry.getKey(), entry.getValue());
        }
    }

    /**
     * Stores the key-value pair.
     *
     * @param key   key of the entry to store
     * @param value value of the entry to store
     */
    public void store(Object key, Object value) {
        if (_access.equalsIgnoreCase("ro")) {
            LOG.warn(String.format("Permission error while inserting or updating document, " +
                    "index [%s], type [%s], key [%s], access [%s]",
                    _index, _type, key, _access));
            return;
        }

        if (LOG.isDebugEnabled()) {
            LOG.debug("Inserting or updating document, index [{}], type [{}], key [{}]",
                    new Object[]{_index, _type, key});
        }

        HttpExchange exchange = new MyExchange(_index, _type, key, _zociaAddressString) {
            @Override
            protected void onResponseComplete() throws IOException {
                if (this.getResponseStatus() % 100 == 2) return;
                super.onResponseComplete();
            }
        };

        exchange.setMethod("PUT");
        exchange.setAddress(_zociaAddress);

        if (value instanceof String) {
            exchange.setRequestContent(new ByteArrayBuffer((String) value));
        } else
            throw new IllegalArgumentException("This persistor can only save String types.");

        exchange.setRequestContentType("text/plain");

        try {
            _client.send(exchange);
        } catch (IOException e) {
            LOG.warn("Failed to store, index [{}], type [[]], key [{}]",
                    new Object[]{_index, _type, key}, e);
        }
    }

    // MapLoader Implementation ----------------------------------------------------


    /**
     * Loads the value of a given key. If distributed map doesn't contain the value
     * for the given key then Hazelcast will call implementation's load (key) method
     * to obtain the value. Implementation can use any means of loading the given key;
     * such as an O/R mapping tool, simple SQL or reading a file etc.
     *
     * @param key
     * @return value of the key
     */
    public Object load(Object key) {
        if (LOG.isDebugEnabled()) {
            LOG.debug("Loading document, index [{}], type [{}], key [{}]",
                    new Object[]{_index, _type, key});
        }

        ContentExchange exchange = new MyExchange(_index, _type, key, _zociaAddressString) {
            @Override
            protected void onResponseComplete() throws IOException {
                if (this.getResponseStatus() % 100 == 2) return;
                super.onResponseComplete();
            }
        };

        exchange.setMethod("GET");
        exchange.setAddress(_zociaAddress);

        try {
            _client.send(exchange);
            int status = exchange.waitForDone();
            if (status == 200) {
                return exchange.getResponseContent();
            }
            LOG.warn(String.format("Failed to load, index [%s], type [%s], key [%s], status [%d]",
                    _index, _type, key, status));
            return null;
        } catch (Exception e) {
            LOG.warn("Failed to load, index [{}], type [[]], key [{}]",
                    new Object[]{_index, _type, key}, e);
        }

        return null;
    }

    /**
     * Loads given keys. This is batch load operation so that implementation can
     * optimize the multiple loads.
     *
     * @param keys keys of the values entries to load
     * @return map of loaded key-value pairs.
     */
    public Map loadAll(Collection keys) {
        Map result = new HashMap(keys.size());
        for (Object key : keys) {
            result.put(key, load(key));
        }
        return result;
    }

    /**
     * Loads all of the keys from the store.
     *
     * @return all the keys
     */
    public Set loadAllKeys() {
        return null;
    }

    // Inner Classes -----------------------------------------------------------

    class MyExchange extends ContentExchange {

        private String _index;
        private String _type;
        private Object _key;
        private String _address;

        public MyExchange(String index, String type, Object key, String address) {
            _index = index;
            _type = type;
            _key = key;
            _address = address;
        }

        @Override
        protected void onResponseComplete() throws IOException {
            if ((int) Math.floor(getResponseStatus() / 100) != 2) {
                LOG.warn(String.format("Unexpected response code from [%s], index [%s], type [%s], key [%s], status [%d]",
                        _address, _index, _type, _key, getResponseStatus()));
            }
        }

        @Override
        protected void onExpire() {
            LOG.warn(String.format("HTTP connection expired to [%s], index [%s], type [%s], key [%s]",
                    _address, _index, _type, _key));
        }

        @Override
        protected void onConnectionFailed(Throwable x) {
            LOG.warn(String.format("HTTP connection failed to [%s], index [%s], type [%s], key [%s]",
                    _address, _index, _type, _key), x);
        }

        @Override
        protected void onException(Throwable x) {
            LOG.warn(String.format("Exception occured during HTTP connection to [%s], index [%s], type [%s], key [%s]",
                    _address, _index, _type, _key), x);
        }
    }
}
