<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Signalement;
use App\Models\SignalementPhoto;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Signalements",
    description: "API CRUD pour les signalements"
)]
class SignalementController extends Controller
{
    #[OA\Get(
        path: "/api/signalements",
        summary: "Lister les signalements",
        tags: ["Signalements"]
    )]
    #[OA\Response(response: 200, description: "Liste des signalements")]
    public function index(): JsonResponse
    {
        return response()->json(
            Signalement::with(['status', 'utilisateur', 'problemes', 'photos'])->get()
        );
    }

    #[OA\Get(
        path: "/api/signalements-unassigned",
        summary: "Lister les signalements non attribués",
        tags: ["Signalements"]
    )]
    #[OA\Response(response: 200, description: "Liste des signalements non attribués")]
    public function unassigned(): JsonResponse
    {
        return response()->json(
            Signalement::with(['status', 'utilisateur', 'photos'])
                ->doesntHave('problemes')
                ->get()
        );
    }

    #[OA\Post(
        path: "/api/signalements",
        summary: "Créer un signalement",
        tags: ["Signalements"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["Id_status", "Id_utilisateur"],
            properties: [
                new OA\Property(property: "position_", type: "string", example: "-18.8792,47.5079"),
                new OA\Property(property: "commentaire", type: "string", example: "Route dégradée"),
                new OA\Property(property: "is_deleted", type: "boolean", example: false),
                new OA\Property(property: "Id_status", type: "integer", example: 1),
                new OA\Property(property: "Id_utilisateur", type: "integer", example: 1)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Signalement créé")]
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'position_' => 'nullable|string',
            'commentaire' => 'nullable|string|max:200',
            'is_deleted' => 'sometimes|boolean',
            'Id_status' => 'required|integer|exists:status,Id_status',
            'Id_utilisateur' => 'required|integer|exists:utilisateur,Id_utilisateur'
        ]);

        $signalement = Signalement::create($request->all());
        return response()->json($signalement, 201);
    }

    #[OA\Get(
        path: "/api/signalements/{id}",
        summary: "Afficher un signalement",
        tags: ["Signalements"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Signalement trouvé")]
    public function show(int $id): JsonResponse
    {
        return response()->json(Signalement::with(['status', 'utilisateur', 'problemes', 'photos'])->findOrFail($id));
    }

    #[OA\Post(
        path: "/api/signalements/{id}/photos/sync",
        summary: "Synchroniser les photos d'un signalement depuis des URLs",
        tags: ["Signalements"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["photos"],
            properties: [
                new OA\Property(property: "photos", type: "array", items: new OA\Items(type: "string", format: "url"))
            ]
        )
    )]
    #[OA\Response(response: 200, description: "Photos synchronisées")]
    public function syncPhotos(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'photos' => 'required|array',
            'photos.*' => 'required|string'
        ]);

        $signalement = Signalement::findOrFail($id);
        $photos = $request->input('photos', []);

        $saved = [];
        $errors = [];

        foreach ($photos as $url) {
            if (!$url) {
                continue;
            }

            $exists = SignalementPhoto::where('Id_signalement', $signalement->Id_signalement)
                ->where('source_url', $url)
                ->first();
            if ($exists) {
                $saved[] = $exists;
                continue;
            }

            try {
                $response = Http::timeout(20)->get($url);
                if (!$response->ok()) {
                    $errors[] = ['url' => $url, 'error' => 'Téléchargement échoué'];
                    continue;
                }

                $contentType = $response->header('Content-Type', 'image/jpeg');
                $extension = str_contains($contentType, 'png') ? 'png' : (str_contains($contentType, 'webp') ? 'webp' : 'jpg');
                $filename = Str::uuid()->toString() . '.' . $extension;
                $relativePath = "signalements/{$signalement->Id_signalement}/{$filename}";

                Storage::disk('public')->put($relativePath, $response->body());

                $photo = SignalementPhoto::create([
                    'Id_signalement' => $signalement->Id_signalement,
                    'path' => $relativePath,
                    'source_url' => $url
                ]);
                $saved[] = $photo;
            } catch (\Throwable $e) {
                $errors[] = ['url' => $url, 'error' => $e->getMessage()];
            }
        }

        return response()->json([
            'saved' => $saved,
            'errors' => $errors
        ]);
    }

    #[OA\Put(
        path: "/api/signalements/{id}",
        summary: "Modifier un signalement",
        tags: ["Signalements"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Signalement modifié")]
    public function update(Request $request, int $id): JsonResponse
    {
        $signalement = Signalement::findOrFail($id);

        $request->validate([
            'position_' => 'nullable|string',
            'commentaire' => 'nullable|string|max:200',
            'is_deleted' => 'sometimes|boolean',
            'Id_status' => 'sometimes|integer|exists:status,Id_status',
            'Id_utilisateur' => 'sometimes|integer|exists:utilisateur,Id_utilisateur'
        ]);

        $signalement->update($request->all());
        return response()->json($signalement);
    }

    #[OA\Delete(
        path: "/api/signalements/{id}",
        summary: "Supprimer un signalement",
        tags: ["Signalements"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Signalement supprimé")]
    public function destroy(int $id): JsonResponse
    {
        Signalement::destroy($id);
        return response()->json(['message' => 'Signalement supprimé']);
    }
}
