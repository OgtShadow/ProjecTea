package app.model;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Map;

@Schema(name = "ValidationErrorResponse", description = "Standard response returned when request payload validation fails.")
public class ValidationErrorResponse {

    @Schema(description = "HTTP status code.", example = "400")
    private int status;

    @Schema(description = "General error type.", example = "Validation failed")
    private String error;

    @Schema(description = "Request path that caused the error.", example = "/api/messages")
    private String path;

    @Schema(description = "Map of invalid fields and corresponding error messages.")
    private Map<String, String> fieldErrors;

    public ValidationErrorResponse() {
    }

    public ValidationErrorResponse(int status, String error, String path, Map<String, String> fieldErrors) {
        this.status = status;
        this.error = error;
        this.path = path;
        this.fieldErrors = fieldErrors;
    }

    public int getStatus() {
        return status;
    }

    public void setStatus(int status) {
        this.status = status;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }

    public void setFieldErrors(Map<String, String> fieldErrors) {
        this.fieldErrors = fieldErrors;
    }
}