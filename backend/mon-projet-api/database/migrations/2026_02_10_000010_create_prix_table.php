<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prix', function (Blueprint $table) {
            $table->increments('Id_prix');
            $table->dateTime('create_at')->nullable();
            $table->dateTime('update_at')->nullable();
            $table->dateTime('date_fin')->nullable();
            $table->decimal('valeur', 15, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prix');
    }
};
