import { useState, useEffect } from 'react';

export type MissionStatus = 'idle' | 'connecting' | 'init' | 'planning' | 'searching' | 'itinerary' | 'done' | 'error' | 'clarifying';

interface MissionUpdate {
  mission_id: string;
  nodes_completed: string[];
  status: MissionStatus;
}

export const useAgentStream = (missionId: string | null) => {
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [status, setStatus] = useState<MissionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!missionId) {
      setCompletedNodes([]);
      setStatus('idle');
      return;
    }

    setStatus('connecting');
    
    // Usar la misma base URL que el resto de la API para apuntar al backend correcto
    const apiBase = import.meta.env.VITE_API_URL || "/api/v1/travel"
    const eventSource = new EventSource(`${apiBase}/stream/${missionId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Ignorar heartbeats (ping)
        if (data.type === 'ping') return;

        // Propagar errores del agente al estado
        if (data.type === 'error') {
          setStatus('error');
          setError(data.error_messages?.join(', ') || 'Error desconocido en la misión.');
          eventSource.close();
          return;
        }

        const update = data as MissionUpdate;
        setCompletedNodes(update.nodes_completed ?? []);
        setStatus(update.status);

        // Cerrar conexión si el agente terminó sus estados terminales
        if (['done', 'error', 'clarifying'].includes(update.status)) {
          eventSource.close();
        }
      } catch (err) {
        console.error("Error parsing SSE data:", err);
      }
    };

    eventSource.onerror = (err) => {
      // EventSource no provee detalles del error por seguridad/specs
      console.error("Error en SSE Stream:", err);
      eventSource.close();
      setStatus('error');
      setError("La conexión con el agente se interrumpió.");
    };

    return () => {
      console.log("SSE Cleanup: Closing EventSource");
      eventSource.close(); // Cleanup al desmontar o cambiar de missionId
    };
  }, [missionId]);

  return { completedNodes, status, error };
};
