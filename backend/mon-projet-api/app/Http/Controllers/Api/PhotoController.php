<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Photo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Photos",
    description: "API CRUD pour les photos des signalements"
)]
class PhotoController extends Controller
{
    #[OA\Get(
        path: "/api/photos",
        summary: "Lister les photos",
        tags: ["Photos"]
    )]
    #[OA\Response(response: 200, description: "Liste des photos")]
    public function index(): JsonResponse
    {
        return response()->json(Photo::with('signalement')->get());
    }

    #[OA\Post(
        path: "/api/photos",
        summary: "Créer une photo",
        tags: ["Photos"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["Id_signalement", "image_base64"],
            properties: [
                new OA\Property(property: "Id_signalement", type: "integer", example: 1),
                new OA\Property(property: "image_base64", type: "string", example: "base64..."),
                new OA\Property(property: "mime_type", type: "string", example: "image/jpeg"),
                new OA\Property(property: "nom_fichier", type: "string", example: "photo_1.jpg"),
                new OA\Property(property: "is_deleted", type: "boolean", example: false)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Photo créée")]
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'Id_signalement' => 'required|integer|exists:signalement,Id_signalement',
            'image_base64' => 'required|string',
            'mime_type' => 'nullable|string|max:100',
            'nom_fichier' => 'nullable|string|max:255',
            'is_deleted' => 'sometimes|boolean'
        ]);

        try {
            $photo = Photo::create($request->all());
            $photo = $this->storeBase64Photo($photo);
            return response()->json($photo, 201);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    #[OA\Get(
        path: "/api/photos/{id}",
        summary: "Afficher une photo",
        tags: ["Photos"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Photo trouvée")]
    public function show(int $id): JsonResponse
    {
        return response()->json(Photo::with('signalement')->findOrFail($id));
    }

    #[OA\Put(
        path: "/api/photos/{id}",
        summary: "Modifier une photo",
        tags: ["Photos"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Photo modifiée")]
    public function update(Request $request, int $id): JsonResponse
    {
        $photo = Photo::findOrFail($id);

        $request->validate([
            'Id_signalement' => 'sometimes|integer|exists:signalement,Id_signalement',
            'image_base64' => 'sometimes|string',
            'mime_type' => 'nullable|string|max:100',
            'nom_fichier' => 'nullable|string|max:255',
            'lien_local' => 'nullable|string|max:255',
            'is_deleted' => 'sometimes|boolean'
        ]);

        try {
            $photo->update($request->all());
            if ($request->filled('image_base64')) {
                $photo = $this->storeBase64Photo($photo);
            }
            return response()->json($photo);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    #[OA\Delete(
        path: "/api/photos/{id}",
        summary: "Supprimer une photo",
        tags: ["Photos"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Photo supprimée")]
    public function destroy(int $id): JsonResponse
    {
        Photo::destroy($id);
        return response()->json(['message' => 'Photo supprimée']);
    }

    private function storeBase64Photo(Photo $photo): Photo
    {
        if (!$photo->image_base64) {
            return $photo;
        }

        [$base64, $mime] = $this->extractBase64AndMime($photo->image_base64, $photo->mime_type);
        $binary = base64_decode($base64, true);
        if ($binary === false) {
            throw new \RuntimeException('base64 invalide');
        }

        $mime = $mime ?: 'image/jpeg';
        $extension = $this->guessExtension($mime);
        $fileName = $photo->nom_fichier ?: ('photo_' . $photo->Id_photo . '.' . $extension);
        $relativePath = 'photos/' . $photo->Id_signalement . '/' . $fileName;

        Storage::disk('local')->put($relativePath, $binary);

        $photo->image_base64 = $base64;
        $photo->mime_type = $mime;
        $photo->lien_local = $relativePath;
        $photo->save();

        return $photo;
    }

    private function extractBase64AndMime(string $raw, ?string $mimeType): array
    {
        $base64 = $raw;
        $mime = $mimeType;

        if (str_contains($raw, 'base64,')) {
            [$meta, $content] = explode('base64,', $raw, 2);
            $base64 = $content;
            if (!$mime && preg_match('/data:(.*?);base64/', $meta, $matches)) {
                $mime = $matches[1] ?? $mime;
            }
        }

        $base64 = preg_replace('/\s+/', '', $base64);
        return [$base64, $mime];
    }

    private function guessExtension(string $mime): string
    {
        return match ($mime) {
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'jpg'
        };
    }
}
