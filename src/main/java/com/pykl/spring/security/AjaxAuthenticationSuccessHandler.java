package com.pykl.spring.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

public class AjaxAuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    public AjaxAuthenticationSuccessHandler() {
        super();
    }

    /**
     * Constructor which sets the <tt>defaultTargetUrl</tt> property of the base class.
     *
     * @param defaultTargetUrl the URL to which the user should be redirected on successful authentication.
     */
    public AjaxAuthenticationSuccessHandler(final String defaultTargetUrl) {
        super(defaultTargetUrl);
    }

    /**
     * Writes a simple text string to the response to let the caller know that authentication
     * was successful.
     */
    @Override
    public void onAuthenticationSuccess(final HttpServletRequest request, final HttpServletResponse response, final Authentication authentication) throws IOException, ServletException {
        response.getWriter().print("AUTH_SUCCESS");
        response.getWriter().flush();
        clearAuthenticationAttributes(request);
    }
}
