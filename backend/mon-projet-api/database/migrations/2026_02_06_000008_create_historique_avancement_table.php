<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('historique_avancement', function (Blueprint $table) {
            $table->increments('Id_historique_avancement');
            $table->dateTime('create_at')->nullable();
            $table->string('nouveau_status', 50);
            $table->unsignedInteger('Id_signalement');

            $table->foreign('Id_signalement')->references('Id_signalement')->on('signalement');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('historique_avancement');
    }
};
