from fastapi import APIRouter
from fastapi.responses import Response
import base64

router = APIRouter()

# Cette API a un prefix vide pour intercepter les fichiers .ico à la racine

@router.get("/light.ico")
def get_light_ico():
    """Retourne l'icône soleil en format ICO pour le thème clair."""
    
    # Contenu ICO simple avec notre soleil (format 16x16)
    # Il s'agit d'un ICO orange/jaune basique représentant le soleil
    ico_content = base64.b64decode(
        'AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAQAQAABILAAASCwAA'
        'AAAAAAAAAAAAAAAA////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP//'
        '/wD///8A////AP///wD///8A////AP///wD///8A////AP7+/gGw1JEg8fHwgvHx8IL+/v4B'
        '////AP///wD///8A////AP///wD///8A////AP///wD///8A/v7+AbDUkSDx8fCC8fHwgvHx'
        '8IL+/v4B////AP///wD///8A////AP///wD///8A////APDw8IDw8PCH8PDwh/Dw8Ifw8PCH'
        '8PDwh/Dw8IDw8PCA////AP///wD///8A////AP///wDw8PCA8PDwh/Dw8Ifw8PCH8PDwh/Dw'
        '8Ifw8PCH8PDwh/Dw8Ifw8PCA////AP///wD///8A////APDw8Ifw8PCH8PDwh/Dw8Ifw8PCH'
        '8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH////AP///wDw8PCA8PDwh/Dw8Ifw8PCH8PDwh/Dw'
        '8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCA////APDw8Ifw8PCH8PDwh/Dw8Ifw8PCH'
        '8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw'
        '8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH'
        '8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH////APDw8Ifw8PCH8PDwh/Dw'
        '8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH////AP///wDw8PCA'
        '8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8IcA////AP///wD/'
        '//8A8PDwgPDw8Ifw8PCH8PDwh/Dw8Ifw8PCH8PDwh/Dw8IDw8PCA////AP///wD///8A////'
        'AP///wD///8A/v7+AbDUkSDx8fCC8fHwgvHx8IL+/v4B////AP///wD///8A////AP///wD/'
        '//8A////AP///wD///8A/v7+AbDUkSDx8fCC8fHwgv7+/gH///8A////AP///wD///8A////'
        'AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD/'
        '//8A////AP///wD///8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='
    )
    
    return Response(
        content=ico_content,
        media_type="image/vnd.microsoft.icon",
        headers={
            "Cache-Control": "public, max-age=86400",  # 1 jour
        }
    )


@router.get("/dark.ico")
def get_dark_ico():
    """Retourne l'icône soleil en format ICO pour le thème sombre."""
    # Même icône que pour le thème clair (notre soleil)
    return get_light_ico()
