<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Photo extends Model
{
    use HasFactory;

    protected $table = 'photo';
    protected $primaryKey = 'Id_photo';

    const CREATED_AT = 'create_at';
    const UPDATED_AT = 'update_at';

    protected $fillable = [
        'Id_signalement',
        'image_base64',
        'mime_type',
        'nom_fichier',
        'lien_local',
        'is_deleted'
    ];

    public function signalement()
    {
        return $this->belongsTo(Signalement::class, 'Id_signalement', 'Id_signalement');
    }
}
