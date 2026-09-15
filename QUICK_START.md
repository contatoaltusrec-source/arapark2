# Ara Park - Guia Rápido

## 🎮 Como Testar

### 1. Instalar dependências
```bash
npm install
```

### 2. Rodar em desenvolvimento
```bash
npm run dev
```

### 3. Abrir no navegador
Acesse `http://localhost:5173`

### 4. Entrar no Ara Park
- Clique no card "Ara Park"
- Clique em "ENTRAR NO PARQUE"
- Use **WASD** ou **setas** para mover
- Pressione **M** para toggle do minimap
- Pressione **ESC** para sair

## 🏗️ Estado Atual

### ✅ Implementado
- **Activities Foundation**: Lifecycle completo, bridge, debug panel
- **Ara Park Shell**: Tela de entrada, navegação, loading
- **Canvas 2D Fallback**: Mundo 3200x3200 com 9 áreas temáticas
- **Unity WebGL Host**: Estrutura pronta para receber build Unity
- **JS Bridge**: Tipos e comunicação React ↔ Unity definidos
- **15 Bots com IA**: Movimentação inteligente pelo mapa
- **Voz por proximidade**: Atenuação suave (180px range)
- **Minimap**: Visualização do mundo completo
- **Assets pixel art**: Árvores, flores, fonte, palco, casas, etc.

### 🔄 Aguardando
- **Build Unity real**: Gerar no Unity Editor e colocar em `public/unity/Build/`
- **LiveKit**: Integração de voz real (Fase 4)
- **Servidor multiplayer**: WebSocket para sincronização (Fase 6)
- **AOI completo**: Area of Interest para escalabilidade (Fase 7)

## 🎯 O que acontece agora

### Sem Unity WebGL (atual)
O sistema detecta que não há build Unity e usa automaticamente o **Canvas 2D fallback**:
- Mostra badge "Canvas 2D (Fallback)"
- Renderiza tudo via HTML5 Canvas
- Mesma funcionalidade completa
- Performance excelente

### Com Unity WebGL (quando disponível)
Quando você colocar os arquivos Unity em `public/unity/Build/`:
- Carrega automaticamente o Unity WebGL
- Mostra badge "Unity WebGL"
- Renderiza via Unity (melhor qualidade, shaders, etc.)
- JS bridge ativa para comunicação

## 📁 Estrutura do Projeto

```
src/
├── activities/
│   ├── foundation/          # Activities Foundation
│   │   ├── ActivityContext.tsx
│   │   ├── ActivityContainer.tsx
│   │   └── ActivityRegistry.ts
│   └── ara-park/           # Ara Park Activity
│       ├── AraParkUnityHost.tsx    # Host principal (Unity + fallback)
│       ├── AraParkCanvas.tsx       # Fallback Canvas 2D
│       ├── AraParkEntry.tsx        # Tela de entrada
│       ├── unity/                  # Integração Unity
│       │   ├── UnityLoader.ts
│       │   └── UnityTypes.ts
│       └── world/                  # Dados do mundo
│           ├── MapData.ts
│           └── WorldRenderer.ts
├── components/
│   └── DebugPanel.tsx
├── pages/
│   └── Home.tsx
└── types/
    └── activities.ts

public/
└── unity/
    ├── Build/                      # Colocar build Unity aqui
    │   └── AraPark.loader.js       # Placeholder (fallback)
    ├── Examples/
    │   └── GameManager.cs          # Exemplo C# para Unity
    └── README.md                   # Guia de build Unity
```

## 🎨 Áreas do Mapa

1. **⛲ Praça Central** - Fonte, bancos, encontros
2. **🎵 Zona Musical** - Palco, jams ao vivo
3. **🎮 Zona de Jogos** - Arcade, competições
4. **🎨 Zona de Arte** - Galerias, criatividade
5. **💻 Zona Tech** - Hackers, inovação
6. **🌿 Trilha Natural** - Floresta, lago
7. **🎪 Palco de Eventos** - Shows, palestras
8. **🌙 Zona Relax** - Espaço calmo
9. **🏪 Mercado** - Barracas, trocas

## 🔧 Próximos Passos

### Para usar Unity WebGL real:
1. Criar projeto Unity
2. Implementar cena com tilemap e avatar
3. Adicionar scripts (ver `public/unity/Examples/GameManager.cs`)
4. Build para WebGL
5. Copiar arquivos para `public/unity/Build/`
6. Recarregar página - Unity carrega automaticamente!

### Para adicionar LiveKit (Fase 4):
1. Instalar `livekit-client`
2. Criar componente de áudio
3. Integrar com bridge Unity
4. Implementar controle de volume por proximidade

### Para adicionar multiplayer (Fase 6):
1. Criar servidor WebSocket
2. Implementar protocolo de mensagens
3. Sincronizar posições
4. Adicionar interpolação

## 🐛 Debug

Clique no botão **🐛** no canto inferior direito para abrir o painel de debug:
- FPS
- Frame Time
- Memory
- Entities renderizadas
- Voice Users
- Current Cell
- Bridge Events

## 📚 Documentação

- `UNITY_INTEGRATION.md` - Guia completo de integração Unity
- `public/unity/README.md` - Como gerar build Unity
- `public/unity/Examples/GameManager.cs` - Exemplo de script C#

## 🎯 Controles

- **WASD / Setas**: Mover
- **M**: Toggle minimap
- **ESC**: Sair do Ara Park
- **🎤**: Toggle microfone (quando LiveKit integrado)

## 💡 Dicas

- O mundo é grande (3200x3200), explore todas as áreas!
- Aproxime-se dos bots para ver o indicador de voz
- Use o minimap para navegar
- O Canvas 2D fallback tem performance excelente
- Quando Unity estiver disponível, a transição é automática

## 🚀 Build de Produção

```bash
npm run build
npm run preview
```

O build gera arquivos otimizados em `dist/`
