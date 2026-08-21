import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { canActOnFarmacia, isUuid } from "./authz.ts";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

Deno.test("admin pode agir sobre qualquer farmácia", () => {
  assertEquals(
    canActOnFarmacia({ isAdmin: true, isFarmacia: false, ownFarmaciaId: null, targetFarmaciaId: B }),
    true,
  );
});

Deno.test("farmácia pode agir sobre os seus próprios recursos", () => {
  assertEquals(
    canActOnFarmacia({ isAdmin: false, isFarmacia: true, ownFarmaciaId: A, targetFarmaciaId: A }),
    true,
  );
});

Deno.test("farmácia NÃO pode agir sobre recursos de outra farmácia", () => {
  assertEquals(
    canActOnFarmacia({ isAdmin: false, isFarmacia: true, ownFarmaciaId: A, targetFarmaciaId: B }),
    false,
  );
});

Deno.test("utilizador sem role não pode agir", () => {
  assertEquals(
    canActOnFarmacia({ isAdmin: false, isFarmacia: false, ownFarmaciaId: A, targetFarmaciaId: A }),
    false,
  );
});

Deno.test("farmácia sem conta associada não pode agir", () => {
  assertEquals(
    canActOnFarmacia({ isAdmin: false, isFarmacia: true, ownFarmaciaId: null, targetFarmaciaId: A }),
    false,
  );
});

Deno.test("recurso sem farmácia definida é negado a não-admins", () => {
  assertEquals(
    canActOnFarmacia({ isAdmin: false, isFarmacia: true, ownFarmaciaId: A, targetFarmaciaId: null }),
    false,
  );
});

Deno.test("isUuid valida identificadores", () => {
  assertEquals(isUuid(A), true);
  assertEquals(isUuid("nao-e-uuid"), false);
  assertEquals(isUuid(undefined), false);
  assertEquals(isUuid("' OR 1=1 --"), false);
});
