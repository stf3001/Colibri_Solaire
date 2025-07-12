"""
API pour servir les icônes statiques PWA
"""

from fastapi import APIRouter
from fastapi.responses import Response
from PIL import Image, ImageDraw
import io
import math

router = APIRouter()

def create_sun_icon(size: int) -> bytes:
    """Créer une icône soleil en PNG de la taille demandée"""
    # Créer une image avec fond orange
    img = Image.new('RGBA', (size, size), (249, 115, 22, 255))  # Orange
    draw = ImageDraw.Draw(img)
    
    # Dessiner le soleil au centre
    center = size // 2
    sun_radius = size // 4
    
    # Soleil central (cercle jaune)
    sun_color = (251, 191, 36, 255)  # Jaune
    draw.ellipse([center - sun_radius, center - sun_radius, 
                  center + sun_radius, center + sun_radius], 
                 fill=sun_color)
    
    # Rayons du soleil
    ray_length = size // 8
    ray_width = max(2, size // 32)
    
    # 8 rayons autour du soleil
    for i in range(8):
        angle = i * math.pi / 4
        start_x = center + int((sun_radius + 2) * math.cos(angle))
        start_y = center + int((sun_radius + 2) * math.sin(angle))
        end_x = center + int((sun_radius + ray_length) * math.cos(angle))
        end_y = center + int((sun_radius + ray_length) * math.sin(angle))
        
        draw.line([(start_x, start_y), (end_x, end_y)], 
                 fill=sun_color, width=ray_width)
    
    # Convertir en bytes PNG
    buffer = io.BytesIO()
    img.save(buffer, format='PNG', optimize=True)
    return buffer.getvalue()

@router.get("/icon-{size}.png")
def get_icon(size: int):
    """Servir une icône PNG de la taille demandée"""
    if size not in [72, 96, 128, 144, 152, 192, 384, 512]:
        # Taille non supportée, retourner 192x192 par défaut
        size = 192
    
    png_data = create_sun_icon(size)
    
    return Response(
        content=png_data,
        media_type="image/png",
        headers={
            "Cache-Control": "public, max-age=31536000",  # Cache 1 an
            "Content-Length": str(len(png_data))
        }
    )

@router.get("/favicon.ico")
def get_favicon():
    """Servir le favicon en format ICO"""
    # Créer une icône 32x32 et la convertir en ICO
    img = Image.new('RGBA', (32, 32), (249, 115, 22, 255))
    draw = ImageDraw.Draw(img)
    
    # Soleil simplifié pour favicon
    center = 16
    sun_radius = 8
    sun_color = (251, 191, 36, 255)
    
    # Cercle central
    draw.ellipse([center - sun_radius, center - sun_radius, 
                  center + sun_radius, center + sun_radius], 
                 fill=sun_color)
    
    # 4 rayons principaux
    for i in range(4):
        angle = i * math.pi / 2
        start_x = center + int(sun_radius * math.cos(angle))
        start_y = center + int(sun_radius * math.sin(angle))
        end_x = center + int((sun_radius + 4) * math.cos(angle))
        end_y = center + int((sun_radius + 4) * math.sin(angle))
        
        draw.line([(start_x, start_y), (end_x, end_y)], 
                 fill=sun_color, width=2)
    
    # Convertir en ICO
    buffer = io.BytesIO()
    img.save(buffer, format='ICO')
    ico_data = buffer.getvalue()
    
    return Response(
        content=ico_data,
        media_type="image/x-icon",
        headers={
            "Cache-Control": "public, max-age=31536000",
            "Content-Length": str(len(ico_data))
        }
    )