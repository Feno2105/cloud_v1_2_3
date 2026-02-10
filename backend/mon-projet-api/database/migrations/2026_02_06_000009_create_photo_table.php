<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('photo', function (Blueprint $table) {
            $table->increments('Id_photo');
            $table->dateTime('create_at')->nullable();
            $table->dateTime('update_at')->nullable();
            $table->unsignedInteger('Id_signalement');
            $table->longText('image_base64')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->string('nom_fichier', 255)->nullable();
            $table->string('lien_local', 255)->nullable();
            $table->boolean('is_deleted')->default(false);

            $table->foreign('Id_signalement')
                ->references('Id_signalement')
                ->on('signalement')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('photo');
    }
};
