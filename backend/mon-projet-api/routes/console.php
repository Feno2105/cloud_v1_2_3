<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Services\FirebaseNotificationService;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('notification:send {userId} {title} {body} {--data=}', function () {
    $userId = (int) $this->argument('userId');
    $title = (string) $this->argument('title');
    $body = (string) $this->argument('body');
    $dataJson = $this->option('data');

    $data = [];
    if ($dataJson) {
        $decoded = json_decode($dataJson, true);
        $data = is_array($decoded) ? $decoded : [];
    }

    $service = new FirebaseNotificationService();
    $success = $service->sendToUser($userId, $title, $body, $data);

    if ($success) {
        $this->info("Notification envoyee a l'utilisateur {$userId}");
        return 0;
    }

    $this->error("Echec de l'envoi a l'utilisateur {$userId}");
    return 1;
})->purpose('Envoyer une notification FCM a un utilisateur');
