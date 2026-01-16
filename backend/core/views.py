from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .logic import process_text

class IngestInspectView(APIView):
    """
    API endpoint to process text and return RSVP frames.
    """
    def post(self, request):
        text = request.data.get('text', '')
        wpm = request.data.get('wpm', 600)
        
        if not text:
            return Response({"error": "No text provided"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            frames = process_text(text, base_wpm=int(wpm))
            return Response({"frames": frames, "total_words": len(frames)}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
