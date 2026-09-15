# Ara Park - Unity WebGL Integration Guide

## Status Atual

✅ **Fase 1**: Activities Foundation - Completa  
✅ **Fase 2**: Ara Park Shell - Completa  
✅ **Fase 3**: Unity WebGL Host - Estrutura pronta, aguardando build Unity

## Arquitetura

```
React Shell (Next.js/React)
    ↓
AraParkUnityHost
    ↓
useUnityLoader
    ↓
┌─────────────────────────────────────┐
│  Unity WebGL Build existe?          │
├─────────────────────────────────────┤
│  SIM → Carrega Unity WebGL          │
│  NÃO → Fallback para Canvas 2D      │
└─────────────────────────────────────┘
```

## Como funciona

### 1. Tentativa de carregar Unity
O sistema tenta carregar `/unity/Build/AraPark.loader.js`

### 2. Se Unity existir
- Carrega o loader script
- Inicializa a instância Unity
- Estabelece JS bridge
- Renderiza o mundo 3D/2D no Unity

### 3. Se Unity NÃO existir (fallback)
- Detecta ausência do build
- Mostra badge "Canvas 2D (Fallback)"
- Carrega `AraParkCanvas` com toda a funcionalidade
- Mesma experiência, render diferente

## JS Bridge

### React → Unity
```typescript
// Enviar posição do jogador
unityInstance.SendMessage('GameManager', 'SetPlayerPosition', '1600,1600');

// Enviar direção
unityInstance.SendMessage('GameManager', 'SetPlayerDirection', 'up');

// Controlar microfone
unityInstance.SendMessage('AudioManager', 'SetMicActive', '1');

// Enviar emote
unityInstance.SendMessage('PlayerController', 'PlayEmote', 'wave');
```

### Unity → React
```csharp
// No Unity C#
void SendPlayerPosition(float x, float y) {
    var message = new {
        type = "UNITY_MESSAGE",
        payload = new {
            type = "PLAYER_POSITION",
            data = new { x, y }
        }
    };
    Application.ExternalCall("postMessage", message);
}

void SendEmoteRequest(string emoteName) {
    var message = new {
        type = "UNITY_MESSAGE",
        payload = new {
            type = "EMOTE_REQUEST",
            data = new { emote = emoteName }
        }
    };
    Application.ExternalCall("postMessage", message);
}
```

## Eventos da Bridge

| Tipo | Direção | Descrição |
|------|---------|-----------|
| `UNITY_LOADED` | Unity → React | Unity inicializado |
| `UNITY_ERROR` | Unity → React | Erro no Unity |
| `PLAYER_POSITION` | Unity → React | Posição do jogador |
| `PLAYER_MOVE` | Unity → React | Jogador se movendo |
| `EMOTE_REQUEST` | Unity → React | Pedido de emote |
| `WORLD_READY` | Unity → React | Mundo pronto |
| `PLAYER_MOVE` | React → Unity | Mover jogador |
| `SET_MIC_ACTIVE` | React → Unity | Ativar/desativar mic |

## Setup do Projeto Unity

### Estrutura recomendada
```
AraPark-Unity/
├── Assets/
│   ├── Scenes/
│   │   └── Main.unity
│   ├── Scripts/
│   │   ├── GameManager.cs
│   │   ├── PlayerController.cs
│   │   ├── AudioManager.cs
│   │   ├── NetworkManager.cs
│   │   └── CameraController.cs
│   ├── Sprites/
│   │   ├── Tiles/
│   │   ├── Characters/
│   │   └── Objects/
│   ├── Prefabs/
│   └── Materials/
├── ProjectSettings/
└── Packages/
```

### GameManager.cs (exemplo)
```csharp
using UnityEngine;
using System.Runtime.InteropServices;

public class GameManager : MonoBehaviour {
    public static GameManager Instance { get; private set; }
    
    void Awake() {
        if (Instance == null) {
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
    }
    
    void Start() {
        // Notifica React que Unity está pronto
        SendMessageToReact("UNITY_LOADED", null);
    }
    
    // Chamado do React
    public void Initialize(string configJson) {
        var config = JsonUtility.FromJson<WorldConfig>(configJson);
        // Inicializa mundo com config
    }
    
    public void SetPlayerPosition(string position) {
        var parts = position.Split(',');
        float x = float.Parse(parts[0]);
        float y = float.Parse(parts[1]);
        // Atualiza posição
    }
    
    void SendMessageToReact(string type, object data) {
        #if UNITY_WEBGL && !UNITY_EDITOR
        var message = JsonUtility.ToJson(new {
            type = "UNITY_MESSAGE",
            payload = new { type, data }
        });
        Application.ExternalEval($"window.postMessage({message}, '*')");
        #endif
    }
}
```

## Próximos Passos

### Fase 4 - LiveKit / JS Bridge Spike
- [ ] Integrar LiveKit JS SDK
- [ ] Captura de microfone
- [ ] Publish/subscribe de áudio
- [ ] Controle de volume por proximidade
- [ ] Bridge Unity ↔ LiveKit

### Fase 5 - Mundo Local (Unity)
- [ ] Tilemap do mapa 3200x3200
- [ ] Sprite do avatar
- [ ] Câmera seguindo jogador
- [ ] Input system (WASD + touch)
- [ ] Colisões

### Fase 6 - Multiplayer
- [ ] Servidor WebSocket
- [ ] Conexão de clientes
- [ ] Spawn de players
- [ ] Sincronização de posição
- [ ] Interpolação

## Comandos

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Servir build de produção
npm run preview
```

## Troubleshooting

### Unity não carrega
- Verifique se os arquivos estão em `public/unity/Build/`
- Abra o console do navegador para ver erros
- Verifique se o CORS está configurado corretamente

### Fallback não funciona
- Verifique se `AraParkCanvas.tsx` existe
- Confira os logs no console

### Performance ruim
- Reduza qualidade dos assets no Unity
- Ajuste Memory Size nas configurações
- Use compression Brotli
- Habilite Data Caching

## Métricas

O painel de debug (🐛) mostra:
- FPS
- Frame Time
- Memory
- Ping
- Entities renderizadas
- Voice Users
- Current Cell
- Bridge Events

## Contato

Para dúvidas sobre integração Unity:
1. Consulte `public/unity/README.md`
2. Verifique os tipos em `src/activities/ara-park/unity/UnityTypes.ts`
3. Examine `UnityLoader.ts` para detalhes do carregamento
