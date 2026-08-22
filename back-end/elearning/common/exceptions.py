from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom exception handler to standardize DRF error responses.
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "success": False,
            "message": "Validation error or invalid request",
            "errors": response.data
        }
        
        # If it's a detail message
        if isinstance(response.data, dict) and "detail" in response.data:
            custom_data["message"] = str(response.data["detail"])
            custom_data["errors"] = None

        response.data = custom_data
    else:
        # Unhandled exceptions
        response = Response(
            {
                "success": False,
                "message": str(exc) or "Internal server error occurred",
                "errors": None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response
