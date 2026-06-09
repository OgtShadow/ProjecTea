import { useEffect, useState, useRef } from 'react';
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

// Używamy proxy z Vite - połączenie będzie przekierowane na backend
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

interface Props {
  currentUser: string | null;
}

function GraphWindow({ currentUser }: Props) {
  const [stats, setStats] = useState<StatData[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stompClientRef = useRef<Client | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Pobieranie danych początkowych
  useEffect(() => {
    if (currentUser) {
      apiFetch('/api/messages/stats')
        .then((r) => {
          if (r.ok) return r.json();
          throw new Error('Failed to fetch stats');
        })
        .then((data) => {
          setStats(data || []);
          setError(null);
        })
        .catch((err) => {
          console.error('Error fetching stats:', err);
          setError('Nie udało się pobrać statystyk');
        });
    }
  }, [currentUser]);

  // Inicjalizacja WebSocketa
  useEffect(() => {
    if (!currentUser) return;

    // Konstruuj URL dla WebSocket (dynamicznie na podstawie bieżącej lokacji)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    const wsUrl = `${protocol}//${host}${port}/ws`;

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setWsConnected(true);
        setError(null);
        console.log('Graph WS connected');

        // Subscribe na statystyki
        subscriptionRef.current = client.subscribe('/topic/stats', (msg: IMessage) => {
          if (msg.body) {
            try {
              const updatedStats = JSON.parse(msg.body) as StatData[];
              setStats(updatedStats || []);
            } catch (error) {
              console.error('Invalid stats payload:', error);
              setError('Błąd parsowania danych WebSocket');
            }
          }
        });
      },
      onDisconnect: () => {
        setWsConnected(false);
        console.log('Graph WS disconnected');
      },
      onStompError: (frame: Frame) => {
        console.error('STOMP error:', frame);
        setWsConnected(false);
        setError('Błąd połączenia WebSocket');
      },
    });

    stompClientRef.current = client;
    client.activate();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (stompClientRef.current && stompClientRef.current.active) {
        stompClientRef.current.deactivate();
      }
    };
  }, [currentUser]);

  return (
    <div className="graph-window">
      <h2>Aktywność na czacie {wsConnected ? '🟢' : '🔴'}</h2>

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