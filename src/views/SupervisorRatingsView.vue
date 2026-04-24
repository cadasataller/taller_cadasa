<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { supabaseRatings, supabase } from '@/lib/supabase';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  Star,
  Tractor,
  HardHat,
  Truck,
  Loader2,
  X,
  RefreshCw,
  Camera,
  Image as ImageIcon
} from 'lucide-vue-next';
import { useRatingsStore } from '@/stores/ratingsStore';
import { useAssignedHoursStore } from '@/stores/assignedHoursStore';
import BaseKPI from '@/components/BaseKPI.vue';
import BaseInput from '@/components/BaseInput.vue';
import BaseToggle from '@/components/BaseToggle.vue';
import BaseRow from '@/components/BaseRow.vue';
import BaseButton from '@/components/BaseButton.vue';

interface Inspeccion {
  id_inspeccion: number;
  fecha: string;
  hora: string;
  foto_url: string;
  observacion: string;
  puntuacion_promedio: number;
  inspector_nombre: string;
}

interface InspGroup {
  label: string;
  items: Inspeccion[];
}

interface SupervisorScore {
  id: number;
  name: string;
  role: string;
  rating: number; // overall global rating just in case
  evalCount: number;
  inspecciones: Inspeccion[];
  filteredAvg?: number;
  groupedInsps?: InspGroup[];
}

const ratingsStore = useRatingsStore();
const assignedHoursStore = useAssignedHoursStore();

const now = new Date();
const tzOffset = now.getTimezoneOffset() * 60000;
const todayDate = new Date(Date.now() - tzOffset).toISOString().split('T')[0];
const yesterdayDate = new Date(Date.now() - tzOffset - 86400000).toISOString().split('T')[0];

const d = new Date();
const day = d.getDay();
const diff = d.getDate() - day + (day === 0 ? -6 : 1);
const startOfWeek = new Date(new Date().setDate(diff)).toISOString().split('T')[0];

const selectedDate = ref('');
const timeFilter = ref('Hoy');

const setTimeFilter = (f: string) => {
  timeFilter.value = f;
  selectedDate.value = '';
};

const onDateSelect = () => {
  timeFilter.value = 'Custom';
};

const showPhotosModal = ref(false);
const currentPhotos = ref<string[]>([]);
const openPhotos = (urlStr: string) => {
  if (!urlStr) return;
  currentPhotos.value = urlStr.split(',').filter(u => u.trim() !== '');
  if (currentPhotos.value.length > 0) showPhotosModal.value = true;
};

const isLoading = ref(true);
const supervisors = ref<SupervisorScore[]>([]);

const currentUserArea = ref('ALL');
const currentUserName = ref('');
const currentUserEmail = ref('');
const router = useRouter();

const isRegularSup = computed(() => currentUserArea.value !== 'EVALUADOR' && currentUserArea.value !== 'ALL');

const filteredSupervisors = computed(() => {
  let result = supervisors.value.map(sup => {
    let filteredInsps = sup.inspecciones;

    if (selectedDate.value) {
      filteredInsps = filteredInsps.filter(i => i.fecha === selectedDate.value);
    } else {
      if (timeFilter.value === 'Hoy') {
        filteredInsps = filteredInsps.filter(i => i.fecha === todayDate);
      } else if (timeFilter.value === 'Ayer') {
        filteredInsps = filteredInsps.filter(i => i.fecha === yesterdayDate);
      } else if (timeFilter.value === 'Semana') {
        filteredInsps = filteredInsps.filter(i => i.fecha >= startOfWeek && i.fecha <= todayDate);
      }
    }

    const filteredAvg = filteredInsps.length > 0
      ? Number((filteredInsps.reduce((acc, i) => acc + i.puntuacion_promedio, 0) / filteredInsps.length).toFixed(1))
      : 0;

    const groupsObj: Record<string, Inspeccion[]> = {};
    filteredInsps.forEach(i => {
      let label = '';
      
      const isRegularSup = currentUserArea.value !== 'EVALUADOR' && currentUserArea.value !== 'ALL';
      const isServiciosGenerales = sup.name.toUpperCase().includes('SERVICIOS GENERALES');
      
      if (isRegularSup) {
        if (timeFilter.value === 'Hoy' || timeFilter.value === 'Ayer' || selectedDate.value !== '') {
          label = 'Registros'; // Flat
        } else if (timeFilter.value === 'Semana') {
          if (isServiciosGenerales) {
            // Group by day
            label = `Día ${i.fecha}`;
          } else {
            label = 'Registros'; // Flat
          }
        } else {
          // timeFilter === 'Todas' -> group by week (default)
          const d = new Date(i.fecha + 'T00:00:00');
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const start = new Date(new Date(d).setDate(diff));
          label = `Semana del ${start.toISOString().split('T')[0]}`;
        }
      } else {
        // DEFAULT logic for Evaluador and ALL: group by week
        const d = new Date(i.fecha + 'T00:00:00');
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const start = new Date(new Date(d).setDate(diff));
        label = `Semana del ${start.toISOString().split('T')[0]}`;
      }
      
      if (!groupsObj[label]) groupsObj[label] = [];
      groupsObj[label].push(i);
    });

    const groupedInsps = Object.keys(groupsObj).sort((a,b) => b.localeCompare(a)).map(k => ({
      label: k,
      items: groupsObj[k]
    }));

    return { ...sup, inspecciones: filteredInsps, filteredAvg, groupedInsps };
  });

  if (timeFilter.value !== 'Todas' || selectedDate.value !== '') {
    result = result.filter(sup => sup.inspecciones.length > 0);
  }

  return result;
});

// --- KPIs ---
const kpiData = computed(() => {
  let totalInsps = 0;
  let totalScoreAvg = 0;
  let excelentes = 0;
  let regular = 0;

  filteredSupervisors.value.forEach(sup => {
    totalInsps += sup.inspecciones.length;
    sup.inspecciones.forEach(i => {
      totalScoreAvg += i.puntuacion_promedio;
      if (i.puntuacion_promedio >= 4.5) excelentes++;
      else if (i.puntuacion_promedio > 0) regular++;
    });
  });

  const avg = totalInsps > 0 ? (totalScoreAvg / totalInsps).toFixed(1) : '0.0';

  return {
    avg,
    totalEvals: totalInsps,
    excelentes,
    regular
  };
});

// --- Modal Nuevo/Editar Registro ---
const showModal = ref(false);
const modalLoading = ref(false);
const btnSaving = ref(false);
const errorMsg = ref('');
const isEditing = ref(false);
const editingId = ref<number | null>(null);

const formEmpleados = ref<any[]>([]);
const formCriterios = ref<any[]>([]);
const formNiveles = ref<any[]>([]);

const supervisoresValidos = computed(() => {
  return formEmpleados.value.filter(e => e.rol?.toUpperCase().includes('SUPERVISOR'));
});

const inspectoresValidos = computed(() => {
  return formEmpleados.value.filter(e => 
    e.rol?.toUpperCase().includes('EVALUADOR') || 
    e.rol?.toUpperCase().includes('INSPECTOR') ||
    e.rol?.toUpperCase().includes('ADMINISTRADOR')
  );
});

const form = ref({
  fecha: new Date().toISOString().split('T')[0],
  hora: new Date().toLocaleTimeString('en-GB', { hour12: false }).substring(0,5),
  id_supervisor: '',
  id_inspector: '',
  observacion: '',
  detalles: {} as Record<number, number> // id_criterio -> puntuacion (1 a 5)
});

const actualAssignedHours = ref<any[]>([]);
const isAssignedHoursLoading = ref(false);
const activeSupervisorArea = ref('');

const loadAssignedHours = async (force = false) => {
  if (!form.value.id_supervisor || !form.value.fecha) {
    actualAssignedHours.value = [];
    return;
  }
  
  isAssignedHoursLoading.value = true;
  try {
    const supervisor = formEmpleados.value.find(e => e.id_empleado.toString() === form.value.id_supervisor.toString());
    
    const email = supervisor?.correo || supervisor?.email || '';
    
    if (email) {
      const area = await assignedHoursStore.fetchSupervisorArea(email, force);
      activeSupervisorArea.value = area;
      if (area) {
        actualAssignedHours.value = await assignedHoursStore.fetchHours(area, form.value.fecha, force);
      } else {
        actualAssignedHours.value = [];
      }
    } else {
      actualAssignedHours.value = [];
    }
  } catch(e) {
    console.error(e);
  } finally {
    isAssignedHoursLoading.value = false;
  }
};

watch(() => [form.value.id_supervisor, form.value.fecha], () => {
  if (showModal.value && !modalLoading.value) {
    loadAssignedHours();
  }
});

const sgFilterEquipo = ref('');
const selectedExtraSupervisorIds = ref<string[]>([]);
const extraSupervisorScores = ref<Record<string, number>>({});
const extraSupervisorObs = ref<Record<string, string>>({});

const isServiciosGenerales = computed(() => activeSupervisorArea.value === 'Servicios Generales');

const availableOtherSupervisors = computed(() => {
  return formEmpleados.value.filter(e => {
    // Determine the area from API string or Store Cache reliably
    const cachedArea = e.email || e.correo ? assignedHoursStore.areaCache[e.email] || assignedHoursStore.areaCache[e.correo] : '';
    const eArea = (e.area || cachedArea || '').toUpperCase();
    const eDept = (e.departamento || '').toUpperCase();
    const isSG = eArea.includes('SERVICIOS GENERALES') || eDept.includes('SERVICIOS GENERALES');

    return e.rol?.toUpperCase().includes('SUPERVISOR') && 
           e.id_empleado.toString() !== form.value.id_supervisor &&
           !isSG; // Filter those who are NOT from Servicios Generales
  });
});

const setExtraScore = (id: string, score: number) => {
  extraSupervisorScores.value[id] = score;
};
const setExtraObs = (id: string, obs: string) => {
  extraSupervisorObs.value[id] = obs;
};

// Reset extra selections when main supervisor changes
watch(() => form.value.id_supervisor, () => {
   sgFilterEquipo.value = '';
   selectedExtraSupervisorIds.value = [];
   extraSupervisorScores.value = {};
   extraSupervisorObs.value = {};
});

const criterion3Label = computed(() => {
  const c3 = formCriterios.value.find(c => c.id_criterio === 3);
  return c3 ? c3.descripcion_tarea : 'Trato al Cliente (3)';
});

const sgUniqueEquipos = computed(() => {
  if (activeSupervisorArea.value !== 'Servicios Generales' || !actualAssignedHours.value) return [];
  const equipos = new Set<string>();
  actualAssignedHours.value.forEach(row => {
    const eq = row.MECANICOS?.['EQUIPO DE TRABAJO'] || 'Sin Equipo';
    equipos.add(eq);
  });
  return Array.from(equipos).sort();
});

const groupedAssignedHours = computed(() => {
  const result: any[] = [];
  const area = activeSupervisorArea.value;
  
  if (!actualAssignedHours.value || actualAssignedHours.value.length === 0) return [];
  
  if (area === 'Servicios Generales') {
    const eMap: any = {};
    actualAssignedHours.value.forEach(row => {
      const eq = row.MECANICOS?.['EQUIPO DE TRABAJO'] || 'Sin Equipo';
      
      // Filter by Equipo if sgFilterEquipo is selected
      if (sgFilterEquipo.value && sgFilterEquipo.value !== eq) return;

      const mech = row.MECANICOS?.NOMBRE || 'Desconocido';
      if (!eMap[eq]) eMap[eq] = { total: 0, mecanicos: {} };
      if (!eMap[eq].mecanicos[mech]) eMap[eq].mecanicos[mech] = { total: 0, items: [] };
      
      eMap[eq].total += parseFloat(row['Duración (horas)'] || '0');
      eMap[eq].mecanicos[mech].total += parseFloat(row['Duración (horas)'] || '0');
      eMap[eq].mecanicos[mech].items.push(row);
    });
    
    Object.keys(eMap).forEach(eqKey => {
       const mechNodes: any[] = [];
       Object.keys(eMap[eqKey].mecanicos).forEach(mKey => {
         mechNodes.push({ name: mKey, total: eMap[eqKey].mecanicos[mKey].total, items: eMap[eqKey].mecanicos[mKey].items });
       });
       result.push({ isSG: true, name: eqKey, total: eMap[eqKey].total, mecanicos: mechNodes });
    });
    
    return result;
  } else {
    const mMap: any = {};
    actualAssignedHours.value.forEach(row => {
      const mech = row.MECANICOS?.NOMBRE || 'Desconocido';
      if (!mMap[mech]) mMap[mech] = { total: 0, items: [] };
      mMap[mech].total += parseFloat(row['Duración (horas)'] || '0');
      mMap[mech].items.push(row);
    });
    
    Object.keys(mMap).forEach(mkey => {
      result.push({ isSG: false, name: mkey, total: mMap[mkey].total, items: mMap[mkey].items });
    });
    
    return result;
  }
});

const resolveTipoTrabajo = (row: any) => {
  if (row.ORDEN_MANTENIMIENTO && row.ORDEN_MANTENIMIENTO.Descripcion) return row.ORDEN_MANTENIMIENTO.Descripcion;
  if (row.OM_SG && row.OM_SG.tipo_trabajo) return row.OM_SG.tipo_trabajo;
  if (row.OM_SG?.ORDEN_MANTENIMIENTO?.Descripcion) return row.OM_SG.ORDEN_MANTENIMIENTO.Descripcion;
  return 'Trabajo General';
};

const filesToUpload = ref<File[]>([]);
const existingPhotos = ref<string[]>([]); // New variable to track existing photos when editing

const fileInput = ref<HTMLInputElement | null>(null);
const cameraInput = ref<HTMLInputElement | null>(null);

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    // Almacena y suma las nuevas fotos a la lista existente
    filesToUpload.value = [...filesToUpload.value, ...Array.from(target.files)];
    // Limpia el input para permitir volver a cargar
    target.value = '';
  }
};

const removeFile = (index: number) => {
  filesToUpload.value.splice(index, 1);
};

const removeExistingPhoto = (index: number) => {
  existingPhotos.value.splice(index, 1);
};

const formatFileSize = (bytes: number) => {
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const loadProfilesForForm = async (emps: any[]) => {
  // Pre-load area cache for everyone so the computed properties have real area data immediately
  for (const e of emps) {
    if (e.rol?.toUpperCase().includes('SUPERVISOR')) {
       const email = e.correo || e.email || '';
       if (email) {
          await assignedHoursStore.fetchSupervisorArea(email);
       }
    }
  }
};

const openNewModal = async () => {
  isEditing.value = false;
  editingId.value = null;
  form.value = {
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toLocaleTimeString('en-GB', { hour12: false }).substring(0,5),
    id_supervisor: '',
    id_inspector: '',
    observacion: '',
    detalles: {}
  };
  filesToUpload.value = []; // Reset files
  existingPhotos.value = [];
  
  // Try to use memory first to avoid loading spinner
  const hasData = formEmpleados.value.length > 0 && formNiveles.value.length > 0 && formCriterios.value.length > 0;
  
  if (!hasData) modalLoading.value = true;
  showModal.value = true;
  
  try {
    let emps = formEmpleados.value;
    if (!hasData) {
       const { data: fetchEmps, error: errEmps } = await supabaseRatings.from('empleados').select('*');
       if (errEmps) console.error("Error empleados:", errEmps);
       if (fetchEmps) {
          formEmpleados.value = fetchEmps;
          emps = fetchEmps;
       }
    }

    if (emps) {
       if (!hasData) await loadProfilesForForm(emps);
       
       // Pre-fill inspector based on email matching for EVALUADOR or ADMINISTRADOR
       if (['EVALUADOR', 'ADMINISTRADOR', 'ALL'].includes(currentUserArea.value.toUpperCase())) {
          const myEmpRecord = emps.find(e => 
             (e.email && e.email.toLowerCase() === currentUserEmail.value.toLowerCase()) || 
             (e.correo && e.correo.toLowerCase() === currentUserEmail.value.toLowerCase())
          );
          if (myEmpRecord) {
             form.value.id_inspector = myEmpRecord.id_empleado.toString();
          }
       }
    }

    let niveles = formNiveles.value;
    if (!hasData) {
       const { data: fetchNiv, error: errNiv } = await supabaseRatings.from('niveles_calificacion').select('*').order('puntuacion', { ascending: true });
       if (errNiv) console.error("Error niveles:", errNiv);
       if (fetchNiv) {
          formNiveles.value = fetchNiv;
          niveles = fetchNiv;
       }
    }

    let crits = formCriterios.value;
    if (!hasData) {
       const { data: fetchCrits, error: errCrits } = await supabaseRatings.from('criterios_evaluacion').select('*');
       if (errCrits) console.error("Error criterios:", errCrits);
       if (fetchCrits) {
          formCriterios.value = fetchCrits;
          crits = fetchCrits;
       }
    }
    
    if (crits) {
      crits.forEach(c => {
        // Seleccionamos la puntuación más alta por defecto si hay niveles, si no 5
        form.value.detalles[c.id_criterio] = niveles && niveles.length > 0 ? niveles[niveles.length - 1].puntuacion : 5; 
      });
    }
  } catch (e) {
    console.error(e);
  } finally {
    modalLoading.value = false;
  }
};

const openEditModal = async (insp: any) => {
  isEditing.value = true;
  editingId.value = insp.id_inspeccion;
  filesToUpload.value = [];
  existingPhotos.value = insp.foto_url ? insp.foto_url.split(',').filter((u:string) => u.trim() !== '') : [];

  // Pree-fill initial known data
  form.value = {
    fecha: insp.fecha,
    hora: insp.hora,
    id_supervisor: '', 
    id_inspector: '', 
    observacion: insp.observacion || '',
    detalles: {}
  };
  
  const hasData = formEmpleados.value.length > 0 && formNiveles.value.length > 0 && formCriterios.value.length > 0;

  if (!hasData) modalLoading.value = true;
  showModal.value = true;

  try {
    let emps = formEmpleados.value;
    if (!hasData) {
       const { data: fetchEmps } = await supabaseRatings.from('empleados').select('*');
       if (fetchEmps) {
          formEmpleados.value = fetchEmps;
          emps = fetchEmps;
       }
    }
    
    if (emps) {
       if (!hasData) await loadProfilesForForm(emps);
       
       // Find the right supervisor matching original DDL lookup
       const mainRecord = ratingsStore.inspecciones.find(i => (i.id_inspeccion || i.id) === insp.id_inspeccion);
       if (mainRecord) {
         form.value.id_supervisor = (mainRecord.id_supervisor || mainRecord.supervisor_id).toString();
         form.value.id_inspector = (mainRecord.id_inspector || mainRecord.inspector_id).toString();
       }
    }

    let niveles = formNiveles.value;
    if (!hasData) {
       const { data: fetchNiv } = await supabaseRatings.from('niveles_calificacion').select('*').order('puntuacion', { ascending: true });
       if (fetchNiv) {
          formNiveles.value = fetchNiv;
          niveles = fetchNiv;
       }
    }

    let crits = formCriterios.value;
    if (!hasData) {
       const { data: fetchCrits } = await supabaseRatings.from('criterios_evaluacion').select('*');
       if (fetchCrits) {
          formCriterios.value = fetchCrits;
          crits = fetchCrits;
       }
    }
    
    if (crits) {
      // Load actual details
      crits.forEach(c => {
         const myDet = ratingsStore.detalles.find(d => d.id_inspeccion === insp.id_inspeccion && d.id_criterio === c.id_criterio);
         if (myDet) {
           form.value.detalles[c.id_criterio] = myDet.puntuacion;
         } else {
           form.value.detalles[c.id_criterio] = niveles && niveles.length > 0 ? niveles[niveles.length - 1].puntuacion : 5; 
         }
      });
    }
  } catch (e) {
     console.error(e);
  } finally {
     modalLoading.value = false;
  }
};

const saveInspeccion = async () => {
  if (!form.value.id_supervisor || !form.value.id_inspector) {
    errorMsg.value = 'Debe seleccionar un Supervisor y un Inspector';
    return;
  }

  // Validate SG Extra Observables
  if (isServiciosGenerales.value && selectedExtraSupervisorIds.value.length > 0) {
     for (const supId of selectedExtraSupervisorIds.value) {
       if (!extraSupervisorObs.value[supId] || extraSupervisorObs.value[supId].trim() === '') {
          errorMsg.value = 'La observación es obligatoria para los supervisores extra (Apoyo SG).';
          return;
       }
     }
  }
  
  btnSaving.value = true;
  errorMsg.value = '';
  
  try {
    const uploadedUrls: string[] = [...existingPhotos.value]; // Keep old photos
    if (filesToUpload.value.length > 0) {
      for (const file of filesToUpload.value) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabaseRatings.storage
          .from('inspecciones_fotos')
          .upload(fileName, file);
          
        if (uploadError) {
           console.error("Error upload:", uploadError);
           throw new Error("Error subiendo imagen. Verifique que el bucket 'inspecciones_fotos' exista y sea público.");
        }
        
        const { data: publicUrlData } = supabaseRatings.storage
          .from('inspecciones_fotos')
          .getPublicUrl(fileName);
          
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }
    
    const foto_url_string = uploadedUrls.join(',');

    let realId = editingId.value;

    if (isEditing.value && editingId.value) {
       // Update Inspeccion
       const { error: errInsp } = await supabaseRatings.from('inspecciones')
         .update({
            fecha: form.value.fecha,
            hora: form.value.hora,
            observacion: form.value.observacion,
            foto_url: foto_url_string || null,
            id_supervisor: parseInt(form.value.id_supervisor),
            id_inspector: parseInt(form.value.id_inspector)
         })
         .eq('id_inspeccion', editingId.value);

       if (errInsp) throw errInsp;
       
       // Override Details By Deleting Then Inserting
       await supabaseRatings.from('inspecciones_detalle').delete().eq('id_inspeccion', editingId.value);
    } else {
       // Create New
       const id_inspeccion = Date.now();
       const { data: newInsp, error: errInsp } = await supabaseRatings.from('inspecciones').insert({
         id_inspeccion,
         fecha: form.value.fecha,
         hora: form.value.hora,
         observacion: form.value.observacion,
         foto_url: foto_url_string || null,
         id_supervisor: parseInt(form.value.id_supervisor),
         id_inspector: parseInt(form.value.id_inspector)
       }).select().single();

       if (errInsp) throw errInsp;
       realId = newInsp.id_inspeccion || newInsp.id;
    }

    const detallesToInsert = Object.keys(form.value.detalles).map(id_criterio => ({
      id_inspeccion: realId,
      id_criterio: parseInt(id_criterio),
      puntuacion: form.value.detalles[parseInt(id_criterio)]
    }));

    const { error: errDet } = await supabaseRatings.from('inspecciones_detalle').insert(detallesToInsert);
    if (errDet) throw errDet;

    // === SG EXTRA SUPERVISORS (TRATO AL CLIENTE #3) ===
    if (isServiciosGenerales.value && selectedExtraSupervisorIds.value.length > 0) {
       for (const [index, extraIdStr] of selectedExtraSupervisorIds.value.entries()) {
          const extraScore = extraSupervisorScores.value[extraIdStr] || 5;
          const extraObsRaw = (extraSupervisorObs.value[extraIdStr] || '').trim();
          const sgObsText = `[SG - ${extraObsRaw}]`;
          const extraId = parseInt(extraIdStr);

          // Find if there is an existing eval for this extraId today
          const existingInsp = ratingsStore.inspecciones.find(
             i => (i.id_supervisor === extraId || i.supervisor_id === extraId) && i.fecha === form.value.fecha
          );

          if (existingInsp) {
             const existingId = existingInsp.id_inspeccion || existingInsp.id;
             const existingObs = existingInsp.observacion || '';
             
             // solo añade si no lo dice ya para no duplicar inmensamente si el usuario actualiza 2 veces.
             const newObs = existingObs.includes(sgObsText) ? existingObs : (existingObs.length > 0 ? `${existingObs}\n${sgObsText}` : sgObsText);

             // Update inspecciones table obs
             await supabaseRatings.from('inspecciones').update({ observacion: newObs }).eq('id_inspeccion', existingId);

             const countRes = await supabaseRatings.from('inspecciones_detalle')
                .select('*', { count: 'exact', head: true })
                .eq('id_inspeccion', existingId)
                .eq('id_criterio', 3);
                
             if ((countRes.count ?? 0) > 0) {
                await supabaseRatings.from('inspecciones_detalle')
                   .update({ puntuacion: extraScore })
                   .eq('id_inspeccion', existingId)
                   .eq('id_criterio', 3);
             } else {
                await supabaseRatings.from('inspecciones_detalle')
                   .insert({ id_inspeccion: existingId, id_criterio: 3, puntuacion: extraScore });
             }
          } else {
             // Create New Inspection
             const newInspId = Date.now() + 1000 + index; // Simple offset
             const { data: newExtra, error: errExtra } = await supabaseRatings.from('inspecciones').insert({
                 id_inspeccion: newInspId,
                 fecha: form.value.fecha,
                 hora: form.value.hora,
                 observacion: sgObsText,
                 foto_url: null,
                 id_supervisor: extraId,
                 id_inspector: parseInt(form.value.id_inspector)
             }).select().single();

             if (!errExtra && newExtra) {
                await supabaseRatings.from('inspecciones_detalle').insert({
                   id_inspeccion: newExtra.id_inspeccion || newExtra.id,
                   id_criterio: 3,
                   puntuacion: extraScore
                });
             }
          }
       }
    }

    showModal.value = false;
    await loadData({ forceStore: true, background: true });
    
    // Reset form
    form.value.observacion = '';
    
  } catch (e: any) {
    errorMsg.value = e.message || 'Error guardando registro';
  } finally {
    btnSaving.value = false;
  }
};


// --- Carga de datos principales ---

const loadData = async ({ forceStore = false, background = false } = {}) => {
  if (!background) isLoading.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      currentUserEmail.value = user.email || '';
      const { data: profile } = await supabase.from('PROFILE').select('*').eq('email', currentUserEmail.value).maybeSingle();
      if (profile) {
        currentUserArea.value = profile.area?.toUpperCase() || 'ALL';
        currentUserName.value = profile.nombre || '';
      }
    }

    await ratingsStore.fetchAll(forceStore);
    
    let sups = ratingsStore.validSupervisors;
    const emps = ratingsStore.empleados;
    const inspecciones = ratingsStore.inspecciones;
    const detalles = ratingsStore.detalles;

    if (emps.length === 0) return;

    // Filtro estricto: Si el área no es EVALUADOR ni ALL, solo ve a sí mismo (filtrado por nombre o hipotetico email)
    if (currentUserArea.value !== 'EVALUADOR' && currentUserArea.value !== 'ALL' && currentUserEmail.value) {
      sups = sups.filter((e: any) => {
        const isEmail = (e.email && e.email.toLowerCase() === currentUserEmail.value.toLowerCase()) || 
                        (e.correo && e.correo.toLowerCase() === currentUserEmail.value.toLowerCase());
        const isName = (e.nombre_completo && currentUserName.value && e.nombre_completo.toLowerCase() === currentUserName.value.toLowerCase());
        return isEmail || isName;
      });
    }

    const mapped: SupervisorScore[] = sups.map((sup: any) => {
      // Normalizing ID references
      const myInspsRaw = inspecciones?.filter((i: any) => (i.id_supervisor || i.supervisor_id) === sup.id_empleado) || [];
      
      let totalScoreGlobal = 0;
      let countGlobal = 0;

      const myInsps: Inspeccion[] = myInspsRaw.map((insp: any) => {
        const inspId = insp.id_inspeccion || insp.id;
        const misDetalles = detalles?.filter((d: any) => d.id_inspeccion === inspId) || [];
        let scoreInsp = 0;
        misDetalles.forEach((d: any) => scoreInsp += d.puntuacion);
        const avgInsp = misDetalles.length > 0 ? Number((scoreInsp / misDetalles.length).toFixed(1)) : 0;
        
        totalScoreGlobal += scoreInsp;
        countGlobal += misDetalles.length;

        const inspector = emps.find((e: any) => e.id_empleado === (insp.id_inspector || insp.inspector_id));

        return {
          id_inspeccion: inspId,
          fecha: insp.fecha,
          hora: insp.hora,
          foto_url: insp.foto_url,
          observacion: insp.observacion,
          puntuacion_promedio: avgInsp,
          inspector_nombre: inspector ? inspector.nombre_completo : 'Desconocido'
        };
      });

      const rating_global = countGlobal > 0 ? Number((totalScoreGlobal / countGlobal).toFixed(1)) : 0;

      return {
        id: sup.id_empleado,
        name: sup.nombre_completo,
        role: sup.rol,
        rating: rating_global,
        evalCount: myInsps.length,
        inspecciones: myInsps
      };
    });

    supervisors.value = mapped;

  } catch (error) {
    console.error('Error fetching data', error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadData();
  window.addEventListener('open-new-record', openNewModal);
});

onUnmounted(() => {
  window.removeEventListener('open-new-record', openNewModal);
});
</script>

<template>
  <div class="p-4 md:p-8 space-y-8 pb-32 md:pb-8">
    <!-- Header/Title -->
    <div class="flex flex-col md:flex-row md:items-start justify-between gap-4">
      <div>
        <h1 class="font-display text-3xl text-gray-900 tracking-tight">Calificaciones de Supervisores</h1>
        <p class="text-sm text-gray-400">Evalúe y gestione el rendimiento operativo del personal.</p>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton v-if="['ALL', 'EVALUADOR'].includes(currentUserArea)" variant="outline" class="border-gray-200 text-gray-500 shadow-sm bg-white cursor-pointer hover:cursor-pointer" @click="router.push('/dashboard?slide=calificaciones&back=/calificaciones')">Ver Dashboard</BaseButton>
        <BaseButton variant="secondary" class="cursor-pointer hover:cursor-pointer" @click="openNewModal">
          Nueva Calificación
        </BaseButton>
      </div>
    </div>

    <!-- Loader principal -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <Loader2 class="w-8 h-8 animate-spin text-main" />
    </div>

    <!-- Contenido cuando ya se cargó todo -->
    <div v-else>
      <!-- KPIs -->
      <div class="grid grid-cols-2 gap-6 mb-8">
        <BaseKPI name="Promedio General" :value="kpiData.avg" color="border-accent" />
        <BaseKPI name="Total Evaluaciones" :value="kpiData.totalEvals.toString()" color="border-main" />
      </div>

      <!-- Main Split Layout -->
      <div class="flex flex-col gap-8 items-start">
        <!-- Main List Container -->
        <div class="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col min-h-[600px] w-full">
        <div class="p-5 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between bg-gray-50/50 gap-4">
          <div class="relative flex-1 w-full max-w-xs px-1 flex gap-2">
            <span class="absolute left-4 top-2.5 text-gray-400">
              <Search class="w-4 h-4" />
            </span>
            <input 
              v-model="selectedDate"
              @change="onDateSelect"
              type="date" 
              class="w-full pl-11 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-main focus:border-main bg-white"
            >
          </div>
          <div class="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <span class="text-[10px] font-bold text-gray-400 uppercase whitespace-nowrap">Tiempo:</span>
            <button @click="setTimeFilter('Todas')" :class="timeFilter === 'Todas' ? 'bg-accent text-main-dark' : 'bg-gray-200 text-gray-500'" class="px-3 py-1 text-[10px] font-bold uppercase rounded-full whitespace-nowrap transition-colors">Todas</button>
            <button @click="setTimeFilter('Hoy')" :class="timeFilter === 'Hoy' ? 'bg-accent text-main-dark' : 'bg-gray-200 text-gray-500'" class="px-3 py-1 text-[10px] font-bold uppercase rounded-full whitespace-nowrap transition-colors">Hoy</button>
            <button @click="setTimeFilter('Ayer')" :class="timeFilter === 'Ayer' ? 'bg-accent text-main-dark' : 'bg-gray-200 text-gray-500'" class="px-3 py-1 text-[10px] font-bold uppercase rounded-full whitespace-nowrap transition-colors">Ayer</button>
            <button @click="setTimeFilter('Semana')" :class="timeFilter === 'Semana' ? 'bg-accent text-main-dark' : 'bg-gray-200 text-gray-500'" class="px-3 py-1 text-[10px] font-bold uppercase rounded-full whitespace-nowrap transition-colors">Semana</button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto bg-gray-50/30">
          <div v-for="supervisor in filteredSupervisors" :key="supervisor.id" class="mb-4">
            
            <!-- Modo Administrador/Evaluador: Vista Plana para 1 registro en Hoy/Ayer O para Modo Normal -->
            <template v-if="isRegularSup || ((timeFilter === 'Hoy' || timeFilter === 'Ayer') && supervisor.inspecciones.length === 1)">
              <div class="px-4 py-2 border border-gray-100 bg-white rounded-xl shadow-sm mb-2">
                <h3 v-if="!isRegularSup" class="text-sm font-bold text-gray-800 mb-2 mt-2">{{ supervisor.name }}</h3>
                <div class="flex flex-col gap-4 mb-2">
                  <div v-for="group in supervisor.groupedInsps" :key="group.label">
                    <h4 v-if="group.label !== 'Registros'" class="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2 mb-2">{{ group.label }}</h4>
                    <div class="divide-y divide-gray-100 flex flex-col gap-2">
                      <div v-for="insp in group.items" :key="insp.id_inspeccion" class="p-4 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 rounded-xl">
                        <div class="min-w-[150px]">
                            <p class="text-xs font-bold text-gray-900">{{ insp.fecha }} &bull; <span class="text-gray-500 font-medium">{{ insp.hora }}</span></p>
                            <p class="text-[10px] text-gray-500 uppercase mt-1">Inspector: <span class="font-bold text-gray-700">{{ insp.inspector_nombre }}</span></p>
                        </div>
                        <div class="text-sm font-bold flex items-center gap-1 min-w-[70px]" :class="insp.puntuacion_promedio >= 4.5 ? 'text-success' : (insp.puntuacion_promedio >= 3 ? 'text-main' : 'text-warning')">
                            {{ insp.puntuacion_promedio }} <Star class="w-3 h-3 inline pb-0.5" :class="insp.puntuacion_promedio >= 4.5 ? 'fill-success' : ''"/>
                        </div>
                        <div class="flex-1 px-2 md:px-6 text-xs text-gray-600 line-clamp-3">
                            {{ insp.observacion || 'Sin observaciones detalladas.' }}
                        </div>
                        <div class="flex-shrink-0 text-right flex items-center justify-end gap-2">
                            <BaseButton v-if="!isRegularSup" variant="outline" class="!py-1.5 !px-3 text-[10px] border-gray-200 cursor-pointer hover:cursor-pointer" @click="openEditModal(insp)">Editar</BaseButton>
                            <BaseButton v-if="insp.foto_url" variant="secondary" class="!py-1.5 !px-3 text-[10px] border-gray-200 cursor-pointer hover:cursor-pointer" @click="openPhotos(insp.foto_url)">Ver Fotos</BaseButton>
                            <span v-else class="text-[10px] text-gray-400 italic px-2">Sin registro visual</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="supervisor.inspecciones.length === 0" class="text-xs text-gray-400 py-4 italic px-2 text-center bg-gray-50 rounded-lg">
                    No hay inspecciones para el filtro seleccionado.
                  </div>
                </div>
              </div>
            </template>

            <!-- Modo Administrador/Evaluador: Expandible con Todos -->
            <template v-else>
              <BaseToggle :title="supervisor.name" :extra="`${supervisor.inspecciones.length} inspecciones`">
                <template #title-extra>
                  <div v-if="supervisor.inspecciones.length > 0" class="text-sm font-bold flex items-center gap-1 ml-2" :class="supervisor.filteredAvg >= 4.5 ? 'text-success' : (supervisor.filteredAvg >= 3 ? 'text-main' : 'text-warning')">
                      {{ supervisor.filteredAvg }} <Star class="w-3 h-3 inline pb-0.5" :class="supervisor.filteredAvg >= 4.5 ? 'fill-success' : ''"/>
                  </div>
                </template>
                <div class="flex flex-col gap-4 mt-4">
                  <div v-for="group in supervisor.groupedInsps" :key="group.label">
                    <h4 v-if="group.label !== 'Registros'" class="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2 mb-2">{{ group.label }}</h4>
                    <div class="divide-y divide-gray-100 flex flex-col gap-2">
                      <div v-for="insp in group.items" :key="insp.id_inspeccion" class="p-4 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-lg shadow-sm">
                        <div class="min-w-[150px]">
                            <p class="text-xs font-bold text-gray-900">{{ insp.fecha }} &bull; <span class="text-gray-500 font-medium">{{ insp.hora }}</span></p>
                            <p class="text-[10px] text-gray-500 uppercase mt-1">Inspector: <span class="font-bold text-gray-700">{{ insp.inspector_nombre }}</span></p>
                        </div>
                        <div class="text-sm font-bold flex items-center gap-1 min-w-[70px]" :class="insp.puntuacion_promedio >= 4.5 ? 'text-success' : (insp.puntuacion_promedio >= 3 ? 'text-main' : 'text-warning')">
                            {{ insp.puntuacion_promedio }} <Star class="w-3 h-3 inline pb-0.5" :class="insp.puntuacion_promedio >= 4.5 ? 'fill-success' : ''"/>
                        </div>
                        <div class="flex-1 px-2 md:px-6 text-xs text-gray-600 line-clamp-3">
                            {{ insp.observacion || 'Sin observaciones detalladas.' }}
                        </div>
                        <div class="flex-shrink-0 text-right flex items-center justify-end gap-2">
                            <BaseButton v-if="!isRegularSup" variant="outline" class="!py-1.5 !px-3 text-[10px] border-gray-200 cursor-pointer hover:cursor-pointer" @click="openEditModal(insp)">Editar</BaseButton>
                            <BaseButton v-if="insp.foto_url" variant="secondary" class="!py-1.5 !px-3 text-[10px] border-gray-200 cursor-pointer hover:cursor-pointer" @click="openPhotos(insp.foto_url)">Ver Fotos</BaseButton>
                            <span v-else class="text-[10px] text-gray-400 italic px-2">Sin registro visual</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="supervisor.inspecciones.length === 0" class="text-xs text-gray-400 py-4 italic px-2 text-center bg-gray-50 rounded-lg">
                    No hay inspecciones para el filtro seleccionado.
                  </div>
                </div>
              </BaseToggle>
            </template>

          </div>
        </div>
      </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredSupervisors.length === 0" class="py-20 text-center w-full">
        <Users class="w-12 h-12 text-gray-200 mx-auto mb-4" />
        <p class="text-gray-400 font-medium">No hay inspecciones para el filtro seleccionado</p>
      </div>
    </div>

    <!-- Modal Ver Fotos -->
    <div v-if="showPhotosModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200">
       <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
             <h3 class="font-display text-xl text-gray-900 tracking-tight">Fotos de la Inspección</h3>
             <button @click="showPhotosModal = false" class="text-gray-400 hover:text-gray-600">
               <X class="w-5 h-5" />
             </button>
          </div>
          <div class="p-6 overflow-y-auto flex-1 bg-gray-100/50">
             <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <img v-for="(img, i) in currentPhotos" :key="i" :src="img" class="w-full h-auto rounded-lg shadow-sm border border-gray-200" />
             </div>
          </div>
       </div>
    </div>

    <!-- Modal Nuevo Registro -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div class="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h3 class="font-display text-xl text-gray-900 tracking-tight">{{ isEditing ? 'Actualizar Inspección' : 'Nueva Inspección' }}</h3>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600">
            <X class="w-5 h-5" />
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          <div v-if="modalLoading" class="py-10 flex justify-center">
            <Loader2 class="w-8 h-8 animate-spin text-main" />
          </div>
          
          <template v-else>
            <!-- Basic Info -->
            <div class="grid grid-cols-2 gap-4">
              <BaseInput type="date" v-model="form.fecha" label="Fecha de Inspección" />
              <BaseInput type="time" v-model="form.hora" label="Hora" />
            </div>

            <!-- Personnels -->
            <div id="inspector-selection-container" class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-500 ml-1">Supervisor a Evaluar</label>
                <!-- Disabled if editing because changing IDs can break mappings depending on rules, but left open just logic. -->
                <select id="select-supervisor-evaluacion" v-model="form.id_supervisor" :disabled="isEditing" class="w-full bg-white px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-main focus:border-main disabled:opacity-50">
                  <option value="" disabled>Seleccione...</option>
                  <option v-for="emp in supervisoresValidos" :key="emp.id_empleado" :value="emp.id_empleado">
                    {{ emp.nombre_completo }}
                  </option>
                </select>
                <p v-if="supervisoresValidos.length === 0" class="text-[10px] text-danger ml-1">No hay empleados con rol SUPERVISOR.</p>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-medium text-gray-500 ml-1">Inspector</label>
                <select 
                  id="select-inspector-evaluacion" 
                  v-model="form.id_inspector" 
                  :disabled="isEditing || currentUserArea.toUpperCase() === 'EVALUADOR'" 
                  class="w-full bg-white px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-main focus:border-main disabled:opacity-50"
                >
                  <option value="" disabled>Seleccione...</option>
                  <option v-for="emp in inspectoresValidos" :key="emp.id_empleado" :value="emp.id_empleado">
                    {{ emp.nombre_completo }}
                  </option>
                </select>
                <p v-if="inspectoresValidos.length === 0" class="text-[10px] text-danger ml-1">No hay empleados con rol EVALUADOR o ADMINISTRADOR.</p>
              </div>
            </div>

            <!-- Criterios -->
            <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p class="text-[10px] uppercase font-bold text-gray-500 mb-4 tracking-widest">Criterios a Evaluar</p>
              <div v-if="formNiveles.length === 0" class="text-xs text-warning font-bold">Cargando niveles de calificación o tabla vacía...</div>
              <div class="space-y-4">
                <div v-for="criterio in formCriterios" :key="criterio.id_criterio" class="flex flex-col md:flex-row md:items-center justify-between gap-2 p-3 bg-white rounded-lg shadow-sm border border-gray-100">
                  <span class="text-sm font-medium text-gray-700">{{ criterio.descripcion_tarea }}</span>
                  <div class="flex items-center gap-1">
                    <button 
                      v-for="nivel in formNiveles" 
                      :key="nivel.puntuacion" 
                      @click="form.detalles[criterio.id_criterio] = nivel.puntuacion"
                      type="button"
                      :title="nivel.etiqueta"
                      class="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm transition-all"
                      :class="form.detalles[criterio.id_criterio] === nivel.puntuacion ? 'bg-accent text-main-dark shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'"
                    >
                      {{ nivel.puntuacion }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Horas de Trabajo Asignadas (Mantenimiento) -->
            <BaseToggle 
                v-if="form.id_supervisor && form.fecha"
                title="Horas Asignadas (Mantenimiento)" 
                :extra="actualAssignedHours.length + ' Registros'"
                :initiallyOpen="false"
                class="border-main/20 ring-1 ring-main/10 shadow-sm"
            >
              <div class="px-2 py-2 flex flex-col gap-3">
                <div class="flex items-center justify-between pb-2 border-b border-gray-100">
                  <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Información proveniente de Sistema de Mantenimiento</p>
                  <BaseButton type="button" variant="outline" class="!py-1 !px-2 text-[10px] bg-white" @click.stop="loadAssignedHours(true)">
                     <RefreshCw v-if="isAssignedHoursLoading" class="w-3 h-3 animate-spin mr-1 inline" />
                     <RefreshCw v-else class="w-3 h-3 mr-1 inline" />
                     Actualizar de BD
                  </BaseButton>
                </div>
                
                <div v-if="isAssignedHoursLoading" class="py-6 flex justify-center">
                  <Loader2 class="w-5 h-5 animate-spin text-main" />
                </div>
                <div v-else-if="actualAssignedHours.length === 0" class="py-4 text-center text-xs text-gray-400 italic bg-gray-50 rounded-lg">
                  No hay horas de trabajo asignadas en mantenimiento para esta fecha.
                </div>
                <div v-else class="flex flex-col gap-4">
                   <!-- SG Equipo Filter -->
                   <div v-if="isServiciosGenerales && sgUniqueEquipos.length > 1" class="flex flex-wrap gap-2 pt-1 pb-2">
                      <label 
                        class="px-3 py-1 flex items-center gap-1.5 border rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
                        :class="sgFilterEquipo === '' ? 'bg-main text-white border-main' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
                      >
                         <input type="radio" value="" v-model="sgFilterEquipo" class="hidden" />
                         Todos
                      </label>
                      <label 
                        v-for="eq in sgUniqueEquipos" :key="eq"
                        class="px-3 py-1 flex items-center gap-1.5 border rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-sm"
                        :class="sgFilterEquipo === eq ? 'bg-accent text-main-dark border-accent-light' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'"
                      >
                         <input type="radio" :value="eq" v-model="sgFilterEquipo" class="hidden" />
                         {{ eq }}
                      </label>
                   </div>
                
                   <div v-for="(group, idx) in groupedAssignedHours" :key="idx" class="bg-white border text-sm border-gray-100 rounded-xl shadow-sm overflow-hidden">
                      
                      <!-- For Servicios Generales (2 levels) -->
                      <template v-if="group.isSG">
                         <div class="bg-gray-100/80 px-4 py-2 font-bold text-gray-800 flex justify-between items-center text-xs border-b border-gray-200">
                            <span class="uppercase tracking-wide text-main">{{ group.name }}</span>
                            <span class="bg-white px-2 py-0.5 rounded shadow-sm text-gray-600">{{ group.total }} hrs totales</span>
                         </div>
                         <div v-for="(mech, midx) in group.mecanicos" :key="midx" class="border-b last:border-0 border-gray-100">
                            <div class="px-4 py-2 bg-gray-50 font-bold text-gray-700 text-[11px] flex justify-between items-center">
                               <span><HardHat class="w-3 h-3 inline mr-1 text-gray-400 relative -top-[1px]" /> {{ mech.name }}</span>
                               <span class="text-accent">{{ mech.total }} hrs</span>
                            </div>
                            <div class="divide-y divide-gray-50">
                               <div v-for="item in mech.items" :key="item.ID_OT" class="px-4 py-2 hover:bg-gray-50 flex items-center justify-between gap-4 text-xs group transition-colors">
                                  <div class="min-w-[120px] flex-1">
                                     <p class="font-medium text-gray-800 line-clamp-2" :title="resolveTipoTrabajo(item)">{{ resolveTipoTrabajo(item) }}</p>
                                  </div>
                                  <div class="text-right flex items-center gap-3 w-32 justify-end shrink-0">
                                     <span class="font-bold text-main">{{ item['Duración (horas)'] || '0' }}h</span>
                                     <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm" :class="item.Estatus === 'Cerrada' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'">{{ item.Estatus || 'Abierta' }}</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </template>
                      
                      <!-- For other areas (1 level) -->
                      <template v-else>
                         <div class="bg-gray-100/80 px-4 py-2 font-bold text-gray-800 flex justify-between items-center text-[11px] border-b border-gray-200">
                            <span><HardHat class="w-3 h-3 inline mr-1 text-gray-500 relative -top-[1px]"/> {{ group.name }}</span>
                            <span class="bg-white px-2 py-0.5 rounded shadow-sm text-gray-600 font-bold text-accent">{{ group.total }} hrs totales</span>
                         </div>
                         <div class="divide-y divide-gray-50">
                            <div v-for="item in group.items" :key="item.ID_OT" class="px-4 py-2 hover:bg-gray-50 flex items-center justify-between gap-4 text-xs group transition-colors">
                               <div class="min-w-[120px] flex-1">
                                  <p class="font-medium text-gray-800 line-clamp-2" :title="resolveTipoTrabajo(item)">{{ resolveTipoTrabajo(item) }}</p>
                               </div>
                               <div class="text-right flex items-center gap-3 w-32 justify-end shrink-0">
                                  <span class="font-bold text-main">{{ item['Duración (horas)'] || '0' }}h</span>
                                  <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-sm" :class="item.Estatus === 'Cerrada' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'">{{ item.Estatus || 'Abierta' }}</span>
                               </div>
                            </div>
                         </div>
                      </template>
                   </div>
                </div>
              </div>
            </BaseToggle>

            <!-- Extra Supervisors (SG) -->
            <BaseToggle
              v-if="form.id_supervisor && form.fecha && isServiciosGenerales"
              title="Calificar a otros Supervisores (Apoyo Servicio / Criterio #3)"
              class="border-accent/40 ring-1 ring-accent/20 bg-accent/5 shadow-sm"
              :initiallyOpen="false"
            >
              <div class="px-4 py-3 flex flex-col gap-4 bg-white border-t border-accent/20 rounded-b-xl">
                 <p class="text-xs text-gray-500 italic mb-1">Selecciona los supervisores de otras áreas que brindaron atención a este trabajador de Servicios Generales hoy. Se generará una evaluación de trato para el mismo.</p>
                 <div v-for="sup in availableOtherSupervisors" :key="sup.id_empleado" class="flex flex-col gap-2 p-2 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors bg-gray-50/50">
                    <label class="flex items-center gap-3 cursor-pointer select-none">
                       <input type="checkbox" :value="sup.id_empleado.toString()" v-model="selectedExtraSupervisorIds" class="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent" />
                       <span class="text-sm font-bold text-gray-800">{{ sup.nombre_completo }} <span class="font-normal text-gray-500 text-xs ml-1">({{ sup.area }})</span></span>
                    </label>
                    
                    <div v-if="selectedExtraSupervisorIds.includes(sup.id_empleado.toString())" class="pl-7 mt-2 flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                       <!-- Criterio 3 -->
                       <div class="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <span class="text-xs font-bold text-gray-700">{{ criterion3Label }}</span>
                          <div class="flex items-center gap-1">
                               <button 
                                  v-for="nivel in formNiveles" 
                                  :key="nivel.puntuacion" 
                                  @click="setExtraScore(sup.id_empleado.toString(), nivel.puntuacion)"
                                  type="button"
                                  :title="nivel.etiqueta"
                                  class="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm transition-all shadow-sm"
                                  :class="extraSupervisorScores[sup.id_empleado.toString()] === nivel.puntuacion ? 'bg-accent text-main-dark' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'"
                                >
                                  {{ nivel.puntuacion }}
                                </button>
                          </div>
                       </div>
                       
                       <!-- Observacion Extra -->
                       <div>
                          <label class="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Observación (Requerida)</label>
                          <textarea
                            :value="extraSupervisorObs[sup.id_empleado.toString()] || ''"
                            @input="setExtraObs(sup.id_empleado.toString(), ($event.target as HTMLTextAreaElement).value)"
                            rows="2"
                            placeholder="Detalle sobre el trato de este supervisor..."
                            class="w-full bg-white px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent resize-none shadow-sm"
                          ></textarea>
                       </div>
                    </div>
                 </div>
              </div>
            </BaseToggle>

            <!-- Fotos y Observacion -->
            <div class="space-y-4">
               <!-- Existing Photos (when editing) -->
               <div v-if="isEditing && existingPhotos.length > 0" class="flex flex-col gap-1.5 pt-2">
                 <label class="text-xs font-medium text-gray-500 ml-1">Fotos Actuales</label>
                 <div class="flex gap-4 overflow-x-auto p-2 border border-gray-100 rounded-lg bg-gray-50">
                    <div v-for="(photo, idx) in existingPhotos" :key="idx" class="relative group flex-shrink-0 w-24 h-24 rounded overflow-hidden">
                       <img :src="photo" class="w-full h-full object-cover" />
                       <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button @click="removeExistingPhoto(idx)" title="Remover" class="w-8 h-8 bg-white/20 rounded text-white hover:bg-danger/80 hover:text-white flex items-center justify-center transition-colors">
                             <X class="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                 </div>
               </div>

               <div class="flex flex-col gap-1.5 focus-within:ring-main-light transition-all">
                  <label class="text-xs font-medium text-gray-500 ml-1">{{ isEditing ? 'Adjuntar Nuevas Fotos' : 'Fotos de la Inspección' }}</label>
                  
                  <div class="flex gap-4">
                    <!-- Opción Archivos/Galería -->
                    <button 
                      type="button" 
                      @click="fileInput?.click()"
                      class="flex-1 flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-200 rounded-xl hover:border-main hover:bg-main/5 transition-all group"
                    >
                      <ImageIcon class="w-6 h-6 text-gray-300 group-hover:text-main" />
                      <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-main">Galería / Archivos</span>
                    </button>

                    <!-- Opción Cámara Directa -->
                    <button 
                      type="button" 
                      @click="cameraInput?.click()"
                      class="flex-1 flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-all group"
                    >
                      <Camera class="w-6 h-6 text-gray-300 group-hover:text-accent" />
                      <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-accent">Tomar Foto</span>
                    </button>
                  </div>

                  <!-- Inputs Ocultos -->
                  <input 
                    ref="fileInput"
                    type="file" 
                    multiple 
                    accept="image/*"
                    @change="handleFileUpload"
                    class="hidden"
                  />
                  <input 
                    ref="cameraInput"
                    type="file" 
                    accept="image/*"
                    capture="environment"
                    @change="handleFileUpload"
                    class="hidden"
                  />

                  <div v-if="filesToUpload.length > 0" class="flex flex-col gap-2 mt-3 p-1 max-h-48 overflow-y-auto">
                    <div v-for="(file, index) in filesToUpload" :key="index" class="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm shadow-sm">
                      <div class="flex flex-col overflow-hidden max-w-[85%]">
                        <span class="font-medium text-gray-700 truncate" :title="file.name">{{ file.name }}</span>
                        <span class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{{ formatFileSize(file.size) }}</span>
                      </div>
                      <button type="button" @click="removeFile(index)" class="p-1.5 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-md transition-colors" title="Eliminar foto">
                        <X class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
               </div>

               <div class="flex flex-col gap-1.5">
                  <label class="text-xs font-medium text-gray-500 ml-1">Observaciones</label>
                  <textarea 
                    v-model="form.observacion" 
                    rows="3" 
                    placeholder="Detalles adicionales sobre la inspección..."
                    class="w-full bg-white px-3 py-2 text-sm text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-main focus:border-main resize-none"
                  ></textarea>
                </div>
            </div>

            <div v-if="errorMsg" class="p-3 bg-danger-bg text-danger text-[11px] font-bold rounded-lg">{{ errorMsg }}</div>
          </template>
        </div>
        
        <div class="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
          <BaseButton variant="tertiary" @click="showModal = false">Cancelar</BaseButton>
          <BaseButton variant="primary" :disabled="modalLoading || btnSaving" @click="saveInspeccion">
            <span v-if="!btnSaving">{{ isEditing ? 'Actualizar Inspección' : 'Guardar Inspección' }}</span>
            <span v-else class="flex items-center gap-2"><Loader2 class="w-4 h-4 animate-spin" /> Procesando...</span>
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
