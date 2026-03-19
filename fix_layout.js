const fs = require('fs');
let code = fs.readFileSync('CommercialDashboard.jsx', 'utf8');

// 1. Wrap Map & Sales Chart
code = code.replace(
    /\{\/\* 상권 지도 \(히트맵 시각화\) \*\/\}\s*<div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col mt-6">/g,
    `{/* 상단 2단 레이아웃: 상권 지도 & 매출 차트 */}\n                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">\n                        {/* 상권 지도 (히트맵 시각화) */}\n                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">`
);

code = code.replace(
    /\{\/\* 차트 영역 \*\/\}\s*<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">\s*\{\/\* 1\. 매출 동향 라인 차트 \*\/\}/g,
    `{/* 1. 매출 동향 라인 차트 */}`
);

// 2. Add middle split for Demo Chart & Delivery Data
code = code.replace(
    /\{\/\* 2\. 인구 분포 바 차트 \*\/\}/g,
    `</div>\n\n                    {/* 중단 2단 레이아웃: 인구 분포 & 배달 현황 */}\n                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">\n                        {/* 2. 인구 분포 바 차트 */}`
);

// 3. Close Demo Chart appropriately and prepare Delivery
// The Demo chart originally ends with </div></div></div> before deliveryData
code = code.replace(
    /                                <\/ResponsiveContainer>\n                            <\/div>\n                        <\/div>\n                    <\/div>\n\n                    \{\/\* 배달 상권 현황 \(새로 추가\) \*\/\}\n                    \{deliveryData && \(/g,
    `                                </ResponsiveContainer>\n                            </div>\n                        </div>\n\n                        {/* 배달 상권 현황 (새로 추가) */}\n                        {deliveryData && (`
);

code = code.replace(
    /\{deliveryData && \(\n\s*<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mt-6">/g,
    `{deliveryData && (\n                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">`
);

// 4. Update Delivery internals for 1/2 width
code = code.replace(
    /<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">/g,
    `<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center flex-1 mt-4">`
);
code = code.replace(
    /<div className="md:col-span-1 h-\[250px\] w-full bg-slate-50 rounded-xl/g,
    `<div className="lg:col-span-1 h-[250px] w-full bg-slate-50 rounded-xl`
);
code = code.replace(
    /<div className="md:col-span-2 space-y-4">/g,
    `<div className="lg:col-span-1 space-y-4">`
);
code = code.replace(
    /<div className="grid grid-cols-2 gap-4">/g,
    `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">`
);

// 5. Close the new grid
code = code.replace(
    /                                <\/div>\n                            <\/div>\n                        <\/div>\n                    \)\}\n\n                    \{\/\* 4\. 커피 프랜차이즈/g,
    `                                </div>\n                            </div>\n                        </div>\n                        )}\n                    </div>\n\n                    {/* 4. 커피 프랜차이즈`
);

fs.writeFileSync('CommercialDashboard.jsx', code);
console.log("Layout fixed successfully.");
