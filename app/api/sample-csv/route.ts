import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "SUPER_USER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Generate sample CSV data
    const csvContent = `FormNo,Storerkey,SKU,Loc,Lot,ID,Qty_OnHand,Qty_Allocated,Qty_Available,Lottable01,Project_Scope,Lottable10,Project_ID,WBS_Element,SKU_Description,SKUGRP,Received_Date,HUID,Owner_Id,stdcube
STO-2024-001,STORE01,SKU001,A01-01-01,LOT001,ITEM001,100,20,80,BATCH001,PROJECT_A,TAG001,PROJ001,WBS001,Sample Product 1,GRP001,2024-01-15,HUID001,OWNER001,1.5
STO-2024-001,STORE01,SKU002,A01-01-02,LOT002,ITEM002,50,10,40,BATCH002,PROJECT_A,TAG002,PROJ001,WBS001,Sample Product 2,GRP001,2024-01-16,HUID002,OWNER001,2.0
STO-2024-002,STORE02,SKU003,B01-01-01,LOT003,ITEM003,75,15,60,BATCH003,PROJECT_B,TAG003,PROJ002,WBS002,Sample Product 3,GRP002,2024-01-17,HUID003,OWNER002,1.8
STO-2024-002,STORE02,SKU004,B01-01-02,LOT004,ITEM004,120,25,95,BATCH004,PROJECT_B,TAG004,PROJ002,WBS002,Sample Product 4,GRP002,2024-01-18,HUID004,OWNER002,2.2
STO-2024-003,STORE03,SKU005,C01-01-01,LOT005,ITEM005,200,40,160,BATCH005,PROJECT_C,TAG005,PROJ003,WBS003,Sample Product 5,GRP003,2024-01-19,HUID005,OWNER003,1.2`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=sample-soh-data.csv",
      },
    })
  } catch (error) {
    console.error("Error generating sample CSV:", error)
    return NextResponse.json({ error: "Failed to generate sample CSV" }, { status: 500 })
  }
}
