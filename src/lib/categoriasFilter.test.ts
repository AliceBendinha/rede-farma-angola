import { describe, it, expect, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  CATEGORIAS_QUERY_KEY,
  createCategoriasInvalidator,
  dedupeCategorias,
  fetchCategoriasComMedicamentos,
} from "./categoriasFilter";

describe("dedupeCategorias", () => {
  it("retorna lista vazia para entrada nula/indefinida", () => {
    expect(dedupeCategorias(null)).toEqual([]);
    expect(dedupeCategorias(undefined)).toEqual([]);
    expect(dedupeCategorias([])).toEqual([]);
  });

  it("remove duplicados causados pelo join e preserva a primeira ocorrência", () => {
    const result = dedupeCategorias([
      { id: "a", nome: "Analgésicos", medicamentos: [{ id: "m1" }] },
      { id: "a", nome: "Analgésicos", medicamentos: [{ id: "m2" }] },
      { id: "b", nome: "Antibióticos", medicamentos: [{ id: "m3" }] },
      { id: "a", nome: "Analgésicos", medicamentos: [{ id: "m4" }] },
    ]);

    expect(result).toEqual([
      { id: "a", nome: "Analgésicos" },
      { id: "b", nome: "Antibióticos" },
    ]);
  });

  it("descarta o campo medicamentos do payload final", () => {
    const result = dedupeCategorias([
      { id: "x", nome: "Vitaminas", medicamentos: [{ id: "m1" }] },
    ]);
    expect(result[0]).not.toHaveProperty("medicamentos");
  });
});

describe("fetchCategoriasComMedicamentos", () => {
  it("faz exactamente uma chamada com inner join e devolve categorias únicas", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [
        { id: "a", nome: "Analgésicos", medicamentos: [{ id: "m1" }] },
        { id: "a", nome: "Analgésicos", medicamentos: [{ id: "m2" }] },
        { id: "b", nome: "Antibióticos", medicamentos: [{ id: "m3" }] },
      ],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });

    const result = await fetchCategoriasComMedicamentos({ from } as any);

    expect(from).toHaveBeenCalledTimes(1);
    expect(from).toHaveBeenCalledWith("categorias");
    expect(select).toHaveBeenCalledWith("id, nome, medicamentos!inner(id)");
    expect(order).toHaveBeenCalledWith("nome");
    expect(result).toEqual([
      { id: "a", nome: "Analgésicos" },
      { id: "b", nome: "Antibióticos" },
    ]);
  });

  it("devolve lista vazia em caso de erro sem propagar excepções", async () => {
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
      }),
    });
    const result = await fetchCategoriasComMedicamentos({ from } as any);
    expect(result).toEqual([]);
  });
});

describe("createCategoriasInvalidator", () => {
  it("invalida a queryKey de categorias quando invocado", () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    const handler = createCategoriasInvalidator(queryClient);
    handler();
    handler();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith({ queryKey: CATEGORIAS_QUERY_KEY });
  });

  it("simula um evento realtime de medicamentos e dispara a invalidação", () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    // Canal fake que captura o callback registado em .on(...)
    let captured: ((payload: unknown) => void) | null = null;
    const fakeChannel = {
      on: (_event: string, _filter: unknown, cb: (payload: unknown) => void) => {
        captured = cb;
        return fakeChannel;
      },
      subscribe: () => fakeChannel,
    };

    const handler = createCategoriasInvalidator(queryClient);
    fakeChannel
      .on("postgres_changes", { event: "*", schema: "public", table: "medicamentos" }, handler)
      .subscribe();

    // Simula INSERT, UPDATE e DELETE
    captured?.({ eventType: "INSERT" });
    captured?.({ eventType: "UPDATE" });
    captured?.({ eventType: "DELETE" });

    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy).toHaveBeenCalledWith({ queryKey: CATEGORIAS_QUERY_KEY });
  });
});