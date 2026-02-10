<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Prix;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

#[OA\Tag(
    name: "Prix",
    description: "API CRUD pour les prix au m²"
)]
class PrixController extends Controller
{
    #[OA\Get(
        path: "/api/prix",
        summary: "Lister les prix",
        tags: ["Prix"]
    )]
    #[OA\Response(response: 200, description: "Liste des prix")]
    public function index(): JsonResponse
    {
        return response()->json(Prix::orderByDesc('Id_prix')->get());
    }

    #[OA\Post(
        path: "/api/prix",
        summary: "Créer un prix",
        tags: ["Prix"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["valeur"],
            properties: [
                new OA\Property(property: "date_fin", type: "string", example: "2026-12-31 23:59:59"),
                new OA\Property(property: "valeur", type: "number", format: "float", example: 25000.00)
            ]
        )
    )]
    #[OA\Response(response: 201, description: "Prix créé")]
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'date_fin' => 'nullable|date',
            'valeur' => 'required|numeric'
        ]);

        $prix = Prix::create($request->all());
        return response()->json($prix, 201);
    }

    #[OA\Get(
        path: "/api/prix/{id}",
        summary: "Afficher un prix",
        tags: ["Prix"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Prix trouvé")]
    public function show(int $id): JsonResponse
    {
        return response()->json(Prix::findOrFail($id));
    }

    #[OA\Put(
        path: "/api/prix/{id}",
        summary: "Modifier un prix",
        tags: ["Prix"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Prix modifié")]
    public function update(Request $request, int $id): JsonResponse
    {
        $prix = Prix::findOrFail($id);

        $request->validate([
            'date_fin' => 'nullable|date',
            'valeur' => 'nullable|numeric'
        ]);

        $prix->update($request->all());
        return response()->json($prix);
    }

    #[OA\Delete(
        path: "/api/prix/{id}",
        summary: "Supprimer un prix",
        tags: ["Prix"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Prix supprimé")]
    public function destroy(int $id): JsonResponse
    {
        Prix::destroy($id);
        return response()->json(['message' => 'Prix supprimé']);
    }
}
