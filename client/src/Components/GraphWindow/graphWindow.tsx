import { useEffect, useMemo, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import type { Frame, IMessage } from '@stomp/stompjs';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './graphWindow.css';
import apiFetch from '../../api';

// Interfejs zgodny z naszym DTO z backendu (MessageStatsDTO)
interface StatData {
  from: string;
  count: number;
}

const BACKEND_URL = ''; // Domyślnie używa proxy z Vite lub domyślnego hosta
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

interface Props {
  currentUser: string | null;
}

function GraphWindow({ currentUser }: Props) {
  const [stats, setStats] = useState<StatData[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  // 1. Pobieranie danych początkowych (zanim ktoś wyśle nową wiadomość na czacie)
  useEffect(() => {
    if (currentUser) {
      // Zakładam, że dodamy prosty endpoint GET w Springu do pobierania statystyk
      apiFetch('/api/messages/stats')
        .then((r) => {
          if (r.ok) return r.json();
          return [];
        })
        .then((data) => setStats(data))
        .catch(console.error);
    }
  }, [currentUser]);

  // 2. Konfiguracja nasłuchiwania WebSocketa na żywo
  const stompClient = useMemo(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${BACKEND_URL}/ws`),
      reconnectDelay: 3000,
      onConnect: (frame: Frame) => {
        setWsConnected(true);
        console.log('Graph WS connected');

        // Nasłuchujemy na kanale statystyk (tutaj backend wypycha zaktualizowane dane)
        client.subscribe('/topic/stats', (msg: IMessage) => {
          if (msg.body) {
            try {
              const updatedStats = JSON.parse(msg.body) as StatData[];
              setStats(updatedStats);
            } catch (error) {
              console.error('Invalid stats payload', error);
            }
          }
        });
      },
      onDisconnect: () => {
        setWsConnected(false);
      },
    });

    return client;
  }, []);

  // 3. Zarządzanie cyklem życia WebSocketa
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

  // Renderowanie komponentu
  return (
    <div className="graph-window">
      <h2>Aktywność na czacie {wsConnected ? '🟢' : '🔴'}</h2>
      
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
                label={(entry) => `${entry.from}: ${entry.count}`}
              >
                {stats.map((entry, index) => (
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