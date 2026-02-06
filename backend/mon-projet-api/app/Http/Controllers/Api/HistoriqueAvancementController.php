<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HistoriqueAvancement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "HistoriqueAvancement",
    description: "API CRUD pour l'historique d'avancement"
)]
class HistoriqueAvancementController extends Controller
{
    #[OA\Get(
        path: "/api/historique-avancements",
        summary: "Lister l'historique d'avancement",
        tags: ["HistoriqueAvancement"]
    )]
    #[OA\Response(response: 200, description: "Liste de l'historique d'avancement")]
    public function index(): JsonResponse
    {
        return response()->json(
            HistoriqueAvancement::with('signalement')->get()
        );
    }

    #[OA\Post(
        path: "/api/historique-avancements",
        summary: "Créer un historique d'avancement",
        tags: ["HistoriqueAvancement"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["nouveau_status", "Id_signalement"],
            properties: [
                new OA\Property(property: "nouveau_status", type: "string", example: "En cours"),
                new OA\Property(property: "Id_signalement", type: "integer", example: 1)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Historique d'avancement créé")]
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'nouveau_status' => 'required|string|max:50',
            'Id_signalement' => 'required|integer|exists:signalement,Id_signalement'
        ]);

        $historique = HistoriqueAvancement::create($request->all());
        return response()->json($historique, 201);
    }

    #[OA\Get(
        path: "/api/historique-avancements/{id}",
        summary: "Afficher un historique d'avancement",
        tags: ["HistoriqueAvancement"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Historique d'avancement trouvé")]
    public function show(int $id): JsonResponse
    {
        return response()->json(HistoriqueAvancement::with('signalement')->findOrFail($id));
    }

    #[OA\Put(
        path: "/api/historique-avancements/{id}",
        summary: "Modifier un historique d'avancement",
        tags: ["HistoriqueAvancement"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Historique d'avancement modifié")]
    public function update(Request $request, int $id): JsonResponse
    {
        $historique = HistoriqueAvancement::findOrFail($id);

        $request->validate([
            'nouveau_status' => 'sometimes|string|max:50',
            'Id_signalement' => 'sometimes|integer|exists:signalement,Id_signalement'
        ]);

        $historique->update($request->all());
        return response()->json($historique);
    }

    #[OA\Delete(
        path: "/api/historique-avancements/{id}",
        summary: "Supprimer un historique d'avancement",
        tags: ["HistoriqueAvancement"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Historique d'avancement supprimé")]
    public function destroy(int $id): JsonResponse
    {
        HistoriqueAvancement::destroy($id);
        return response()->json(['message' => "Historique d'avancement supprimé"]);
    }
}
