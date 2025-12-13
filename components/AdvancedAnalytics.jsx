import React from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#2a5298', '#1e3c72', '#e74c3c', '#f39c12', '#27ae60', '#3498db'];

export default function AdvancedAnalytics({ conversations, messages, searchHistory }) {
  // Stat Boxes
  const stats = {
    totalConversations: conversations?.length || 0,
    totalMessages: messages?.length || 0,
    favorites: conversations?.filter(c => c.isFavorite)?.length || 0,
    searches: searchHistory?.length || 0,
  };

  // Simple Problem Types Chart
  const problemTypes = [
    { name: 'Plomberie', value: 2 },
    { name: 'Chauffage', value: 1 },
    { name: 'Électricité', value: 1 },
    { name: 'Autre', value: 2 }
  ];

  // Timeline Chart (7 jours)
  const timeline = [
    { date: 'J-6', count: 1 },
    { date: 'J-5', count: 1 },
    { date: 'J-4', count: 0 },
    { date: 'J-3', count: 2 },
    { date: 'J-2', count: 1 },
    { date: 'J-1', count: 0 },
    { date: 'Aujourd\'hui', count: conversations?.length || 0 }
  ];

  // Messages par conversation (dernières 5)
  const convMessages = conversations
    ?.slice(-5)
    ?.map(c => ({
      title: c.title?.substring(0, 12) + '...' || 'Conv',
      messages: c.messages?.length || 0
    })) || [];

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <h2 style={{ marginBottom: '25px', fontSize: '24px', fontWeight: 'bold' }}>📊 Analytique</h2>

      {/* Stat Boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ background: '#f0f4f8', padding: '20px', borderRadius: '10px', border: '1px solid #e0e7ff' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>📝 Conversations</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2a5298' }}>{stats.totalConversations}</div>
        </div>
        <div style={{ background: '#f0f4f8', padding: '20px', borderRadius: '10px', border: '1px solid #e0e7ff' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>💬 Messages</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#e74c3c' }}>{stats.totalMessages}</div>
        </div>
        <div style={{ background: '#f0f4f8', padding: '20px', borderRadius: '10px', border: '1px solid #e0e7ff' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>⭐ Favoris</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#27ae60' }}>{stats.favorites}</div>
        </div>
        <div style={{ background: '#f0f4f8', padding: '20px', borderRadius: '10px', border: '1px solid #e0e7ff' }}>
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px', fontWeight: '500' }}>🔍 Recherches</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#9b59b6' }}>{stats.searches}</div>
        </div>
      </div>

      {/* Graphiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {/* Pie Chart */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e0e7ff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>🔧 Types de Problèmes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={problemTypes}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, value }) => `${name} (${value})`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {problemTypes.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        {convMessages.length > 0 && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e0e7ff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>💬 Messages par Conv</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={convMessages} margin={{ top: 5, right: 10, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis dataKey="title" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: '6px' }} />
                <Bar dataKey="messages" fill="#2a5298" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Line Chart */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e0e7ff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>📈 Timeline (7 jours)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: '6px' }} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#2a5298"
                strokeWidth={2}
                dot={{ fill: '#2a5298', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Mots-clés */}
      {searchHistory && searchHistory.length > 0 && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px solid #e0e7ff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600' }}>🔍 Historique Recherche</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {searchHistory.slice(0, 8).map((search, i) => (
              <span
                key={i}
                style={{
                  background: COLORS[i % COLORS.length],
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                • {search.substring(0, 20)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}