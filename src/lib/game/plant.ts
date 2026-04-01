import { Container, Graphics } from "pixi.js";

const PLANT_POSITIONS = [
  [-280, 100],
  [280, 100],
  [-280, 250],
  [280, 250],
  [-100, 330],
  [100, 330],
];

function createPlant(): Container {
  const plant = new Container();

  // Pot
  const pot = new Graphics();
  pot.rect(-2, 1, 4, 4);
  pot.fill({ color: 0x8a7050 });
  plant.addChild(pot);

  // Leaves
  const leaves = new Graphics();
  leaves.circle(0, -2, 5);
  leaves.fill({ color: 0x2a6a3a, alpha: 0.8 });
  leaves.circle(-2, -5, 3);
  leaves.fill({ color: 0x3a8a4a, alpha: 0.6 });
  plant.addChild(leaves);

  return plant;
}

export function createPlants(): Container {
  const container = new Container();

  for (const [px, py] of PLANT_POSITIONS) {
    const plant = createPlant();
    plant.x = px;
    plant.y = py;
    container.addChild(plant);
  }

  return container;
}
