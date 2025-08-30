# CORS Debugger

A comprehensive tool for testing and debugging Cross-Origin Resource Sharing (CORS) issues in your application.

## Features

- Test CORS preflight (OPTIONS) and actual requests
- Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS)
- Detailed request and response headers
- Automatic URL handling (supports both full URLs and paths)
- Copy API base URL with a single click
- Helpful error messages and suggestions
- Development-only access (automatically disabled in production)

## How to Use

1. **Access the Debugger**
   - In development mode, navigate to `/dev-tools` in your application
   - The debugger is only available in development mode for security

2. **Test an Endpoint**
   - Select the HTTP method from the dropdown
   - Enter the endpoint URL or path (e.g., `/api/users` or `https://api.example.com/users`)
   - Click "Test" to run the CORS check

3. **Understanding the Results**
   - **Preflight Test**: Shows the OPTIONS request results
   - **Request Test**: Shows the actual request results
   - **Headers**: View all response headers
   - **Suggestions**: Get help fixing common CORS issues

## Common CORS Issues and Solutions

### 1. Missing CORS Headers
```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### 2. Credentials with Wildcard Origin
If using credentials, specify exact origins instead of `*`:
```http
Access-Control-Allow-Origin: https://your-frontend.com
Access-Control-Allow-Credentials: true
```

### 3. Missing Preflight Headers
Ensure your server responds with the correct headers for OPTIONS requests.

## Development

### Environment Variables

- `VITE_API_URL` or `REACT_APP_API_URL`: Set your API base URL
- `NODE_ENV=development`: Required to access the debugger

### Adding to Your Application

The CORS debugger is automatically included in development mode. No additional setup is required.

## Security Note

This tool is automatically disabled in production builds. Never enable it in production environments as it could expose sensitive information about your API.

## License

This tool is part of the Goat Farm Management Application and follows the same license terms.
