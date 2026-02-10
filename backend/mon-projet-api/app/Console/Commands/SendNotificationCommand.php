<?php

namespace App\Console\Commands;

use App\Services\FirebaseNotificationService;
use Illuminate\Console\Command;

class SendNotificationCommand extends Command
{
    protected $signature = 'notification:send
                            {userId : ID de l\'utilisateur}
                            {title : Titre de la notification}
                            {body : Corps de la notification}
                            {--data= : Donnees JSON optionnelles}';

    protected $description = 'Envoyer une notification FCM a un utilisateur';

    public function handle(): int
    {
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
            return Command::SUCCESS;
        }

        $this->error("Echec de l'envoi a l'utilisateur {$userId}");
        return Command::FAILURE;
    }
}
