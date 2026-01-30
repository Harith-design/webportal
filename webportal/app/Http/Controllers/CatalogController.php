<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CatalogController extends Controller
{
    /**
     * STEP 1: List distinct compound codes (general products) for catalogue
     * GET /api/catalog/products
     */
    public function products()
    {
        $rows = DB::connection('sqlsrv_sap')
            ->table('item_specifications')
            ->select('U_CompoundCode as compoundCode')
            ->where('U_IsVisible', 'Y')
            ->whereNotNull('U_CompoundCode')
            ->distinct()
            ->orderBy('U_CompoundCode')
            ->get();

        return response()->json($rows);
    }

    /**
     * STEP 2: Get dropdown options for a selected compound
     * GET /api/catalog/products/{compoundCode}/options
     */
    public function options($compoundCode)
    {
        $rows = DB::connection('sqlsrv_sap')
            ->table('item_specifications')
            ->select([
                'U_Width',
                'U_TopWidth',
                'U_BaseWidth',
                'U_Thickness',
                'U_Length',
            ])
            ->where('U_IsVisible', 'Y')
            ->where('U_CompoundCode', $compoundCode)
            ->get();

        // Helper: ignore null/empty and ignore 0 (0 means "not applicable" in your data)
        $clean = function ($v) {
            if ($v === null) return null;
            if (is_string($v) && trim($v) === '') return null;
            if (is_numeric($v) && floatval($v) == 0.0) return null;
            return is_string($v) ? trim($v) : $v;
        };

        $widths = $rows->pluck('U_Width')->map($clean)->filter()->unique()->values();
        $topWidths = $rows->pluck('U_TopWidth')->map($clean)->filter()->unique()->values();
        $baseWidths = $rows->pluck('U_BaseWidth')->map($clean)->filter()->unique()->values();
        $thicknesses = $rows->pluck('U_Thickness')->map($clean)->filter()->unique()->values();
        $lengths = $rows->pluck('U_Length')->map($clean)->filter()->unique()->values();

        // Sort numeric-like values nicely (handles "26.0" etc.)
        $sortNumeric = function ($collection) {
            $arr = $collection->all();
            usort($arr, fn($a, $b) => floatval($a) <=> floatval($b));
            return array_values($arr);
        };

        return response()->json([
            'compoundCode' => $compoundCode,
            'options' => [
                'widths' => $sortNumeric($widths),
                'topWidths' => $sortNumeric($topWidths),
                'baseWidths' => $sortNumeric($baseWidths),
                'thicknesses' => $sortNumeric($thicknesses),
                'lengths' => $sortNumeric($lengths),
            ],
        ]);
    }

    /**
     * STEP 3: Resolve selected specs to the exact ItemCode
     * GET /api/catalog/resolve?compoundCode=CTA&width=232&length=3000
     *
     * Optional params: topWidth, baseWidth, thickness
     */
    public function resolveItem(Request $request)
    {
        $compoundCode = $request->query('compoundCode');

        if (!$compoundCode) {
            return response()->json([
                'error' => 'compoundCode is required'
            ], 422);
        }

        // Read specs from query. They might come as "26.0" strings.
        $width = $request->query('width');
        $topWidth = $request->query('topWidth');
        $baseWidth = $request->query('baseWidth');
        $thickness = $request->query('thickness');
        $length = $request->query('length');

        // Normalize numeric string -> float (so "26.0" matches DB numeric)
        $toNumber = function ($v) {
            if ($v === null || $v === '') return null;
            return floatval($v);
        };

        $query = DB::connection('sqlsrv_sap')
            ->table('item_specifications')
            ->select([
                'U_ItemCode',
                'U_CompoundCode',
                'U_Width',
                'U_TopWidth',
                'U_BaseWidth',
                'U_Thickness',
                'U_Length',
                'U_CompoundSKU',
            ])
            ->where('U_IsVisible', 'Y')
            ->where('U_CompoundCode', $compoundCode);

        // Only apply filters if user provided them
        if ($width !== null && $width !== '') {
            $query->where('U_Width', $toNumber($width));
        }
        if ($topWidth !== null && $topWidth !== '') {
            $query->where('U_TopWidth', $toNumber($topWidth));
        }
        if ($baseWidth !== null && $baseWidth !== '') {
            $query->where('U_BaseWidth', $toNumber($baseWidth));
        }
        if ($thickness !== null && $thickness !== '') {
            $query->where('U_Thickness', $toNumber($thickness));
        }
        if ($length !== null && $length !== '') {
            $query->where('U_Length', $toNumber($length));
        }

        // Try to find exact match
        $matches = $query->limit(5)->get();

        if ($matches->count() === 0) {
            return response()->json([
                'error' => 'No matching item found for selected specs',
                'input' => [
                    'compoundCode' => $compoundCode,
                    'width' => $width,
                    'topWidth' => $topWidth,
                    'baseWidth' => $baseWidth,
                    'thickness' => $thickness,
                    'length' => $length,
                ],
            ], 404);
        }

        // If multiple matches, return them so frontend can show "please refine"
        if ($matches->count() > 1) {
            return response()->json([
                'error' => 'Multiple items matched. Please select more specs to narrow down.',
                'input' => [
                    'compoundCode' => $compoundCode,
                    'width' => $width,
                    'topWidth' => $topWidth,
                    'baseWidth' => $baseWidth,
                    'thickness' => $thickness,
                    'length' => $length,
                ],
                'matches' => $matches,
            ], 409);
        }

        $item = $matches->first();

        return response()->json([
            'itemCode' => $item->U_ItemCode,
            'compoundCode' => $item->U_CompoundCode,
            'spec' => [
                'width' => $item->U_Width,
                'topWidth' => $item->U_TopWidth,
                'baseWidth' => $item->U_BaseWidth,
                'thickness' => $item->U_Thickness,
                'length' => $item->U_Length,
            ],
            'compoundSku' => $item->U_CompoundSKU,
        ]);
    }

    /**
     * STEP 3B: Fetch a single item_specifications row by ItemCode (variant pick)
     * GET /api/catalog/item/{itemCode}
     */
    public function itemByCode($itemCode)
    {
        $row = DB::connection('sqlsrv_sap')
            ->table('item_specifications')
            ->select([
                'U_ItemCode',
                'U_CompoundCode',
                'U_Width',
                'U_TopWidth',
                'U_BaseWidth',
                'U_Thickness',
                'U_Length',
                'U_CompoundSKU',
                'U_IsVisible',
            ])
            ->where('U_IsVisible', 'Y')
            ->where('U_ItemCode', $itemCode)
            ->first();

        if (!$row) {
            return response()->json([
                'error' => 'ItemCode not found in item_specifications',
                'itemCode' => $itemCode
            ], 404);
        }

        return response()->json([
            'itemCode' => $row->U_ItemCode,
            'compoundCode' => $row->U_CompoundCode,
            'spec' => [
                'width' => $row->U_Width,
                'topWidth' => $row->U_TopWidth,
                'baseWidth' => $row->U_BaseWidth,
                'thickness' => $row->U_Thickness,
                'length' => $row->U_Length,
            ],
            'compoundSku' => $row->U_CompoundSKU,
        ]);
    }
}
