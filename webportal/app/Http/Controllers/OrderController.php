<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    // Store a new sales order
    public function store(Request $request)
    {
        // Validate input
        $request->validate([
            'customer_id' => 'required|integer',
            'order_date' => 'required|date',
            'items' => 'required|array', // each item can have id, quantity, price
        ]);

        // Insert order into orders table
        $orderId = DB::table('orders')->insertGetId([
            'customer_id' => $request->customer_id,
            'order_date' => $request->order_date,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insert order items into order_items table
        foreach ($request->items as $item) {
            DB::table('order_items')->insert([
                'order_id' => $orderId,
                'item_id' => $item['id'],
                'quantity' => $item['quantity'],
                'price' => $item['price'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Order created successfully',
            'order_id' => $orderId,
        ], 201);
    }
}
