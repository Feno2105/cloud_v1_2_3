<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HistoriqueAvancement extends Model
{
    use HasFactory;

    protected $table = 'historique_avancement';
    protected $primaryKey = 'Id_historique_avancement';

    const CREATED_AT = 'create_at';
    const UPDATED_AT = null;

    protected $fillable = [
        'nouveau_status',
        'Id_signalement'
    ];

    public function signalement()
    {
        return $this->belongsTo(Signalement::class, 'Id_signalement', 'Id_signalement');
    }
}
