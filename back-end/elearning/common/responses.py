from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, message="Success", status_code=status.HTTP_200_OK):
    """
    Standard format for successful API responses.
    """
    payload = {
        "success": True,
        "message": message,
        "data": data
    }
    return Response(payload, status=status_code)


def error_response(message="An error occurred", errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    """
    Standard format for error API responses.
    """
    payload = {
        "success": False,
        "message": message,
        "errors": errors
    }
    return Response(payload, status=status_code)
