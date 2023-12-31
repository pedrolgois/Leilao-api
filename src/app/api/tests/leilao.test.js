import { GET, POST } from './api'

describe('GET /api', () => {
    test('retorna uma resposta JSON com a lista de itens', async () => {
      const response = await GET();
      expect(Array.isArray(response)).toBe(true);
    });
  });

describe('GET /api/id', () => {
test('retorna uma resposta JSON com um item em especifíco', async () => {
    const response = await GET();
    expect(Array.isArray(response)).toBe(true);
});
});

describe('POST /api', () => {
    test('retorna uma resposta JSON com a lista de itens', async () => {
        const response = await POST();
        expect(response).toBe("ok");
    });
});