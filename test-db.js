const { createClient } = require("@supabase/supabase-js");

// الروابط الموثقة والسليمة تماماً للفحص السريع من داخل الـ Terminal
const supabaseUrl = "https://oirhaemoefjkqbfxhgqb.supabase.co";
const supabaseAnonKey = "sb_publishable_l9DBN1Veuw4WGTAD29KROQ_oL5e8Lhs";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runFullAudit() {
	console.log("\n======================================================");
	console.log("🐯 TIGER SECURITY SYSTEM — LIVE DATA AUDIT REPORT 🐯");
	console.log("======================================================");

	console.log("\n1. جاري فحص المنتجات والروابط الحقيقية...");
	const { data: products, error: pError } = await supabase
		.from("products")
		.select("id, title, price, images")
		.limit(2);

	if (pError) {
		console.error("❌ خطأ في قراءة المنتجات:", pError.message);
	} else {
		console.log(
			`✅ تم التوصيل بنجاح! عينة من المنتجات والروابط الحية داخل سيرفرك:`,
		);
		products.forEach((p) => {
			console.log(`   - المنتج: \${p.title} | السعر: \${p.price}`);
			console.log(`     رابط الصورة المخزن: \${JSON.stringify(p.images)}`);
		});
	}
	console.log("\n======================================================\n");
}
runFullAudit();
