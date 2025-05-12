// components/CargaMasivaImagenes.jsx
import { useState } from 'react';
import axios from 'axios';
import { apiBase } from '@/endpoints/api';

const CargaMasivaImagenes = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (!files.length) return;
    
    setUploading(true);
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('images', file);
    });
    
    try {
      // Ajusta la URL a tu API
      const response = await axios.post(`${apiBase}/productosPuntoDeVenta/cargaMasiva/imagenes` , formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setResults(response.data.results);
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
      setResults([{
        filename: 'Error general',
        success: false,
        error: error.message || 'Error en la solicitud'
      }]);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Carga Masiva de Imágenes</h1>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-2">
          Nombra tus imágenes con el código de barras de cada producto (ej: 123456789.jpg)
        </p>
        <label className="block mb-2">
          Selecciona múltiples imágenes:
        </label>
        <input 
          type="file" 
          multiple 
          accept="image/*" 
          onChange={handleFileChange}
          className="border p-2 w-full"
        />
      </div>
      
      <button 
        onClick={handleUpload}
        disabled={!files.length || uploading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
      >
        {uploading ? 'Subiendo...' : 'Subir Imágenes'}
      </button>
      
      {files.length > 0 && (
        <div className="mt-4">
          <p>Archivos seleccionados: {files.length}</p>
        </div>
      )}
      
      {results.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">Resultados:</h2>
          <div className="mt-2 border rounded p-4">
            <div className="grid grid-cols-1 gap-2">
              {results.map((result, index) => (
                <div key={index} className={`p-2 border rounded ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.filename}
                  </p>
                  {result.success ? (
                    <p className="text-sm">Asociada a: {result.productName}</p>
                  ) : (
                    <p className="text-sm text-red-500">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargaMasivaImagenes;