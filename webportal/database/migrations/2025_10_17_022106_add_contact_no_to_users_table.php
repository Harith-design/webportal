<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Add contact_no column after email (nullable)
            if (!Schema::hasColumn('users', 'contact_no')) {
                $table->string('contact_no', 50)->nullable()->after('email');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop contact_no column if it exists
            if (Schema::hasColumn('users', 'contact_no')) {
                $table->dropColumn('contact_no');
            }
        });
    }
};
