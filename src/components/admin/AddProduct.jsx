import { useState } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

export default function AddProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    bodega: '',
    varietal: '',
    origen: '', // <-- EL NUEVO CAMPO
    precioBase: 0,
    stock: 1,
    descripcion: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'productos'), {
        ...formData,
        precioFinal: formData.precioBase,
        createdAt: new Date()
      });
      alert("Cargado con éxito");
      navigate('/locked-cellar');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-neutral-white pt-32 px-6 pb-20">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-10 shadow-sm space-y-8">
        <h2 className="font-playfair italic text-4xl text-dark-blue mb-10">Cargar Etiqueta</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inputs estándar que ya tenías */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-poppins font-black uppercase tracking-widest text-dark-blue/40">Nombre</label>
            <input name="nombre" onChange={handleChange} className="border-b border-dark-blue/10 py-2 outline-none font-playfair italic text-lg" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-poppins font-black uppercase tracking-widest text-dark-blue/40">Bodega</label>
            <input name="bodega" onChange={handleChange} className="border-b border-dark-blue/10 py-2 outline-none uppercase font-poppins text-sm" />
          </div>

          {/* CAMPO ORIGEN: El que agregamos hoy */}
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-[9px] font-poppins font-black uppercase tracking-widest text-dark-blue/40">Origen (Provincia / País)</label>
            <input name="origen" onChange={handleChange} placeholder="Ej: Mendoza, Argentina" className="border-b border-dark-blue/10 py-2 outline-none font-poppins text-sm italic" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-poppins font-black uppercase tracking-widest text-dark-blue/40">Precio</label>
            <input type="number" name="precioBase" onChange={handleChange} className="border-b border-dark-blue/10 py-2 outline-none font-poppins" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-poppins font-black uppercase tracking-widest text-dark-blue/40">Stock</label>
            <input type="number" name="stock" onChange={handleChange} className="border-b border-dark-blue/10 py-2 outline-none font-poppins" />
          </div>
        </div>

        <button type="submit" className="w-full bg-dark-blue text-neutral-white py-4 font-poppins font-black uppercase tracking-widest hover:bg-brand-orange transition-colors">
          Guardar Etiqueta
        </button>
      </form>
    </div>
  );
}