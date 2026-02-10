<?php

namespace App\Services;

use App\Models\Signalement;
use App\Models\Utilisateur;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FirebaseNotificationService
{
    private string $fcmUrl = 'https://fcm.googleapis.com/fcm/send';
    private ?string $serverKey;

    public function __construct()
    {
        $this->serverKey = env('FIREBASE_SERVER_KEY');
    }

    public function sendToUser(int $userId, string $title, string $body, array $data = []): bool
    {
        $user = Utilisateur::find($userId);

        if (!$user || !$user->fcm_token) {
            Log::warning('FCM token manquant', ['user_id' => $userId]);
            return false;
        }

        return $this->sendToToken($user->fcm_token, $title, $body, $data);
    }

    public function sendToToken(string $fcmToken, string $title, string $body, array $data = []): bool
    {
        if (!$this->serverKey) {
            Log::error('FIREBASE_SERVER_KEY manquant');
            return false;
        }

        $payload = [
            'to' => $fcmToken,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'sound' => 'default'
            ],
            'data' => $data,
            'priority' => 'high'
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post($this->fcmUrl, $payload);

            $status = method_exists($response, 'status')
                ? $response->status()
                : (method_exists($response, 'getStatusCode') ? $response->getStatusCode() : null);

            $body = method_exists($response, 'body')
                ? $response->body()
                : (method_exists($response, 'getBody') ? (string) $response->getBody() : null);

            if ($status !== null && $status >= 200 && $status < 300) {
                Log::info('Notification FCM envoyee', ['status' => $status]);
                return true;
            }

            Log::error('Erreur FCM', ['status' => $status, 'response' => $body]);
            return false;
        } catch (\Throwable $e) {
            Log::error('Exception FCM', ['error' => $e->getMessage()]);
            return false;
        }
    }

    public function notifySignalementStatusChange(int $signalementId, string $nouveauStatus): bool
    {
        $signalement = Signalement::with('utilisateur')->find($signalementId);

        if (!$signalement || !$signalement->utilisateur) {
            Log::warning('Signalement ou utilisateur introuvable', ['signalement_id' => $signalementId]);
            return false;
        }

        $title = 'Mise a jour de votre signalement';
        $body = "Le statut de votre signalement #{$signalementId} a ete mis a jour : {$nouveauStatus}";
        $data = [
            'type' => 'signalement_update',
            'signalement_id' => (string) $signalementId,
            'nouveau_status' => $nouveauStatus
        ];

        return $this->sendToUser($signalement->utilisateur->Id_utilisateur, $title, $body, $data);
    }

    public function notifyProblemeAssigned(int $signalementId, string $entrepriseNom): bool
    {
        $signalement = Signalement::with('utilisateur')->find($signalementId);

        if (!$signalement || !$signalement->utilisateur) {
            Log::warning('Signalement ou utilisateur introuvable', ['signalement_id' => $signalementId]);
            return false;
        }

        $title = 'Probleme assigne';
        $body = "Votre signalement #{$signalementId} a ete assigne a l'entreprise : {$entrepriseNom}";
        $data = [
            'type' => 'probleme_assigned',
            'signalement_id' => (string) $signalementId,
            'entreprise' => $entrepriseNom
        ];

        return $this->sendToUser($signalement->utilisateur->Id_utilisateur, $title, $body, $data);
    }
}
