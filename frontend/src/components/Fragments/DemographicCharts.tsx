"use client";

import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Users, ActivitySquare } from "lucide-react";

interface DemographicsData {
  gender?: { L: number; P: number };
  age?: Record<string, number>;
  ipm?: {
    usia_harapan_hidup: number;
    harapan_lama_sekolah: number;
    rata_rata_lama_sekolah: number;
    pengeluaran_per_kapita: number;
  };
  kemiskinan?: {
    jumlah_penduduk_miskin_ribu_jiwa: number;
    persentase_penduduk_miskin: number;
    garis_kemiskinan_rp: number;
  };
}

interface DemographicChartsProps {
  data?: DemographicsData;
  regionName: string;
}

const COLORS = ["#0ea5e9", "#ec4899"]; // Blue for L, Pink for P

export const DemographicCharts: React.FC<DemographicChartsProps> = ({ data, regionName }) => {
  if (!data || (!data.gender && !data.age && !data.ipm && !data.kemiskinan)) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-4">
        <ActivitySquare className="w-10 h-10 mb-2 opacity-20" />
        <p className="text-sm font-semibold">Data Rincian Tidak Tersedia</p>
        <p className="text-xs text-center mt-1 opacity-70">
          Rincian sub-indikator untuk wilayah ini belum dirilis oleh BPS.
        </p>
      </div>
    );
  }

  // Format Gender Data
  const genderData = data.gender
    ? [
        { name: "Laki-laki", value: data.gender.L },
        { name: "Perempuan", value: data.gender.P },
      ]
    : [];

  const totalGender = genderData.reduce((acc, curr) => acc + curr.value, 0);

  // Format Age Data
  const ageData = data.age
    ? Object.entries(data.age).map(([group, value]) => ({
        ageGroup: group,
        jumlah: value,
      }))
    : [];

  return (
    <div className="mt-6 flex flex-col gap-6">
      {data.gender && (
      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          Komposisi Gender - {regionName}
        </h3>
        
        {genderData.length > 0 ? (
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => new Intl.NumberFormat('id-ID').format(value) + " jiwa"}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Custom Legend inside the Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800">
                {new Intl.NumberFormat('id-ID').format(totalGender)}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Penduduk</span>
            </div>
            
            {/* Legend Below */}
            <div className="flex justify-center gap-4 mt-2">
              {genderData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  {entry.name} ({(entry.value / totalGender * 100).toFixed(1)}%)
                </div>
              ))}
            </div>
          </div>
        ) : (
           <p className="text-xs text-slate-400 italic">Data gender tidak tersedia.</p>
        )}
      </div>
      )}

      {data.age && (
      <div className="border-t border-slate-200 pt-5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
          <ActivitySquare className="w-4 h-4 text-primary" />
          Rasio Kelompok Umur - {regionName}
        </h3>
        
        {ageData.length > 0 ? (
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="ageGroup" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={1}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                />
                <Tooltip 
                  formatter={(value: any) => new Intl.NumberFormat('id-ID').format(value) + " jiwa"}
                  labelStyle={{ fontWeight: 'bold', color: '#334155' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="jumlah" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Data kelompok umur tidak tersedia.</p>
        )}
      </div>
      )}
      {/* Rincian Komponen IPM */}
      {data.ipm && (
        <div className="border-t border-slate-200 pt-5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <ActivitySquare className="w-4 h-4 text-primary" />
            Komponen Penyusun IPM - {regionName}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Usia Harapan Hidup</span>
              <span className="text-lg font-black text-slate-800">{data.ipm.usia_harapan_hidup} <span className="text-xs text-slate-500 font-semibold">Tahun</span></span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Harapan Lama Sekolah</span>
              <span className="text-lg font-black text-slate-800">{data.ipm.harapan_lama_sekolah} <span className="text-xs text-slate-500 font-semibold">Tahun</span></span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Rata-rata Lama Sekolah</span>
              <span className="text-lg font-black text-slate-800">{data.ipm.rata_rata_lama_sekolah} <span className="text-xs text-slate-500 font-semibold">Tahun</span></span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Pengeluaran / Kapita</span>
              <span className="text-lg font-black text-slate-800">Rp {new Intl.NumberFormat('id-ID').format(data.ipm.pengeluaran_per_kapita * 1000)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Rincian Indikator Kemiskinan */}
      {data.kemiskinan && (
        <div className="border-t border-slate-200 pt-5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
            <ActivitySquare className="w-4 h-4 text-primary" />
            Rincian Indikator Kemiskinan - {regionName}
          </h3>
          <div className="flex flex-col gap-3">
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                Persentase Penduduk Miskin (P0)
              </span>
              <span className="text-2xl font-black text-slate-800">
                {data.kemiskinan.persentase_penduduk_miskin}{" "}
                <span className="text-sm text-slate-500 font-semibold">%</span>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Jumlah Penduduk Miskin
                </span>
                <span className="text-base font-black text-slate-800">
                  {new Intl.NumberFormat("id-ID").format(
                    data.kemiskinan.jumlah_penduduk_miskin_ribu_jiwa
                  )}{" "}
                  <span className="text-xs text-slate-500 font-semibold">
                    Ribu Jiwa
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  (&plusmn; {new Intl.NumberFormat("id-ID").format(
                    Math.round(
                      data.kemiskinan.jumlah_penduduk_miskin_ribu_jiwa * 1000
                    )
                  )} jiwa)
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                  Garis Kemiskinan
                </span>
                <span className="text-base font-black text-slate-800">
                  Rp {new Intl.NumberFormat("id-ID").format(
                    data.kemiskinan.garis_kemiskinan_rp
                  )}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  / kapita / bulan
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
