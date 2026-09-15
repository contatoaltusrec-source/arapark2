# Unity WebGL Build - Ara Park

## Como gerar o build Unity

1. Abra o projeto Unity do Ara Park
2. Vá em **File > Build Settings**
3. Selecione **WebGL** como plataforma
4. Clique em **Switch Platform**
5. Configure as opções:
   - Compression Format: **Brotli** (recomendado)
   - Code Optimization: **Size** (para produção)
   - Data Caching: **Enabled**
6. Clique em **Build**
7. Selecione a pasta `public/unity/Build/` como destino

## Arquivos gerados

Após o build, você deve ter:
- `AraPark.data` - Assets e dados
- `AraPark.framework.js` - Framework Unity
- `AraPark.loader.js` - Loader script
- `AraPark.wasm` - WebAssembly (se não comprimido)

## Estrutura esperada

```
public/
  unity/
    Build/
      AraPark.data
      AraPark.framework.js
      AraPark.loader.js
    StreamingAssets/
      (arquivos de streaming, se houver)
```

## Fallback

Se os arquivos Unity não forem encontrados, o sistema automaticamente usa o **Canvas 2D** como fallback, mantendo toda a funcionalidade do Ara Park.

## Configurações recomendadas

### Player Settings
- **Api Compatibility Level**: .NET Standard 2.1
- **Scripting Backend**: IL2CPP
- **Target Format**: WASM (WebAssembly)
- **Memory Size**: 256 MB (ajustar conforme necessidade)

### Publishing Settings
- **Compression Format**: Brotli
- **Decompression Fallback**: Enabled
- **Code Optimization**: Size

### Resolution and Presentation
- **Default Screen Width**: 1920
- **Default Screen Height**: 1080
- **Run In Background**: Enabled

## JS Bridge

O Unity se comunica com React através de:

### Unity → React (SendMessage)
```csharp
// No Unity C#
Application.ExternalCall("postMessage", new {
    type = "UNITY_MESSAGE",
    payload = new UnityMessage {
        type = "PLAYER_POSITION",
        data = new { x = 100, y = 200 }
    }
});
```

### React → Unity (SendMessage)
```typescript
// No React
unityInstance.SendMessage('GameManager', 'SetPlayerPosition', '100,200');
```

## Testando

1. Gere o build Unity
2. Copie os arquivos para `public/unity/Build/`
3. Rode `npm run dev`
4. Abra o Ara Park - deve carregar o Unity WebGL
5. Se os arquivos não existirem, usa Canvas 2D automaticamente
