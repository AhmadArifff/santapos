'use client';
import Link from 'next/link';

export default function BranchCard({ branch }) {
  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(branch.address)}/@${branch.latitude},${branch.longitude},15z`;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-5xl mb-2">📍</div>
          <p className="text-sm font-semibold">{branch.name}</p>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-lg text-gray-800">{branch.name}</h3>
        
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <span className="text-orange-500 flex-shrink-0 mt-0.5 text-lg">📍</span>
          <p>{branch.address}</p>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-orange-500 flex-shrink-0 text-lg">📱</span>
          <a href={`tel:${branch.phone}`} className="hover:text-orange-600 font-medium">
            {branch.phone}
          </a>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-orange-500 flex-shrink-0 text-lg">🕒</span>
          <span>{branch.hours}</span>
        </div>
        
        <Link 
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg font-semibold text-center transition-colors mt-4"
        >
          🗺️ Buka di Google Maps
        </Link>
      </div>
    </div>
  );
}
