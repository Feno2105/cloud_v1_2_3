<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HistoriqueAvancement;
use App\Models\Signalement;
use App\Models\Status;
use App\Services\FirebaseNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
            Signalement::with(['status', 'utilisateur'])
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
        return response()->json(
            Signalement::with(['status', 'utilisateur', 'problemes', 'photos'])->findOrFail($id)
        );
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

        try {
            $result = DB::transaction(function () use ($request, $signalement) {
                if ($request->has('Id_status') && (int) $request->Id_status !== (int) $signalement->Id_status) {
                    $signalement->load('utilisateur');
                    if (!$signalement->utilisateur || !$signalement->utilisateur->fcm_token) {
                        throw new \RuntimeException('veuillez sync pour avoir token');
                    }

                    $status = Status::find($request->Id_status);
                    if ($status) {
                        $notificationService = new FirebaseNotificationService();
                        $sent = $notificationService->notifySignalementStatusChange(
                            $signalement->Id_signalement,
                            $status->libelle
                        );

                        if (!$sent) {
                            throw new \RuntimeException('echec envoi notification');
                        }

                        HistoriqueAvancement::create([
                            'nouveau_status' => $status->libelle,
                            'Id_signalement' => $signalement->Id_signalement
                        ]);
                    }
                }

                $signalement->update($request->all());
                return $signalement;
            });

            return response()->json($result);
        } catch (\RuntimeException $e) {
            $message = $e->getMessage();
            $status = $message === 'veuillez sync pour avoir token' ? 422 : 500;
            return response()->json(['message' => $message], $status);
        }
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
