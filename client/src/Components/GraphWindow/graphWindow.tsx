import { useEffect, useMemo, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import type { Frame, IMessage } from '@stomp/stompjs';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import './graphWindow.css';
import apiFetch from '../../api';

interface StatData {
  from: string;
  count: number;
}

const BACKEND_URL = '';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

interface Props {
  currentUser: string | null;
  messageUpdateTrigger?: number;
}

function GraphWindow({ currentUser, messageUpdateTrigger }: Props) {
  const [stats, setStats] = useState<StatData[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setStats([]);
      return;
    }

    apiFetch('/api/messages/stats')
      .then((r) => {
        if (!r.ok) {
          throw new Error(`Stats request failed: ${r.status}`);
        }
        return r.json();
      })
      .then((data: StatData[]) => {
        setStats(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((e) => {
        console.error('[GraphWindow] Error loading stats:', e);
        setError('Nie udało się pobrać statystyk');
      });
  }, [currentUser, messageUpdateTrigger]);

  const stompClient = useMemo(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws`),
      reconnectDelay: 3000,
      debug: (str: string) => {
        console.debug('[GraphWindow STOMP]', str);
      },
      onConnect: (frame: Frame) => {
        console.log('[GraphWindow] WS connected', frame);
        setError(null);

        console.log('[GraphWindow] Subscribing to /topic/stats...');
        const subscription = client.subscribe('/topic/stats', (msg: IMessage) => {
          console.log('[GraphWindow] Received stats:', msg.body);
          if (msg.body) {
            try {
              const updatedStats = JSON.parse(msg.body) as StatData[];
              console.log('[GraphWindow] Stats updated:', updatedStats);
              setStats(updatedStats || []);
            } catch (error) {
              console.error('[GraphWindow] Error parsing stats:', error);
              setError('Błąd parsowania danych');
            }
          }
        });
        console.log('[GraphWindow] Subscription created:', subscription);
      },
      onStompError: (frame: Frame) => {
        console.error('[GraphWindow] STOMP error:', frame);
        setError('Błąd połączenia WebSocket');
      },
      onDisconnect: () => {
        console.log('[GraphWindow] WS disconnected');
        setError('Połączenie WebSocket zostało zamknięte');},
    });

    return client;
  }, []);

  // Inicjalizacja WebSocketa
  useEffect(() => {
    if (!currentUser) {
      if (stompClient.active) stompClient.deactivate();
      return;
    }

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [currentUser, stompClient]);

  return (
    <div className="graph-window">
      <h2>Aktywność na czacie</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {stats.length === 0 ? (
        <p>Brak danych do wyświetlenia...</p>
      ) : (
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={stats}
                dataKey="count"
                nameKey="from"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                label={(props: PieLabelRenderProps) => {
                  if (typeof props.value === 'number') {
                    return `${props.name}: ${props.value}`;
                  }
                  return '';
                }}
              >
                {stats.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default GraphWindow;
