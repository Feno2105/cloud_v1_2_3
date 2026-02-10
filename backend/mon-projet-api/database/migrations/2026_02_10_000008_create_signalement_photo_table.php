<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('signalement_photo', function (Blueprint $table) {
            $table->bigIncrements('Id_photo');
            $table->unsignedBigInteger('Id_signalement');
            $table->string('path', 255);
            $table->text('source_url')->nullable();
            $table->timestamps();

            $table->foreign('Id_signalement')
                ->references('Id_signalement')
                ->on('signalement')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signalement_photo');
    }
};
