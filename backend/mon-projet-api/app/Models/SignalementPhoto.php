<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SignalementPhoto extends Model
{
    use HasFactory;

    protected $table = 'signalement_photo';
    protected $primaryKey = 'Id_photo';

    protected $fillable = [
        'Id_signalement',
        'path',
        'source_url'
    ];

    public function signalement()
    {
        return $this->belongsTo(Signalement::class, 'Id_signalement', 'Id_signalement');
    }
}
