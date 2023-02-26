let layerIndex = 0;

class NeuralLayer {
  constructor(weights, biases, activation) {
    this.index = layerIndex++;
    this.inputs = weights[0].length;
    this.outputs = weights.length;
    if (biases.length != this.outputs)
      throw new Error(
        "Biases must be the same length as the number of outputs"
      );
    this.weights = weights.flat();
    this.biases = biases.flat();
    this.activation = activation;
  }

  activationCode(inp) {
    switch (this.activation.toLowerCase()) {
      case "sigmoid":
        return `1.0 / (1.0 + exp(-${inp}))`;
      case "elu":
        return `(${inp} > 0.0 ? ${inp} : exp(${inp}) - 1.0)`;
      case "relu":
        return `max(0.0, ${inp})`;
      case "tanh":
        return `tanh(${inp})`;
      case "none":
        return `${inp}`;
      default:
        throw new Error(`Unknown activation function ${this.activation}`);
    }
  }

  code() {
    const { index, inputs, outputs } = this;
    return `
uniform float[${outputs * inputs}] nn_layer_${index}_weights;
uniform float[${outputs}] nn_layer_${index}_biases;

float[${outputs}] NN_LAYER_${index}(float[${inputs}] inputCoeffs) {
  float[${outputs}] outputCoeffs;
  for (int i = 0; i < ${outputs}; i++) {
    outputCoeffs[i] = nn_layer_${index}_biases[i];
    for (int j = 0; j < ${inputs}; j++) {
        outputCoeffs[i] += inputCoeffs[j] * nn_layer_${index}_weights[i * ${inputs} + j];
    }
    float a = outputCoeffs[i];
    outputCoeffs[i] = ${this.activationCode("a")};
  }
  return outputCoeffs;
}
    `;
  }

  setUniforms(uniforms) {
    if (!uniforms[`nn_layer_${this.index}_weights`])
      uniforms[`nn_layer_${this.index}_weights`] = { value: null };
    uniforms[`nn_layer_${this.index}_weights`].value = this.weights;
    if (!uniforms[`nn_layer_${this.index}_biases`])
      uniforms[`nn_layer_${this.index}_biases`] = { value: null };
    uniforms[`nn_layer_${this.index}_biases`].value = this.biases;
  }
}

export default class NeuralNet {
  constructor() {
    this.layers = [];
  }

  addLayer(layer) {
    this.layers.push(layer);
  }

  setUniforms(uniforms) {
    this.layers.forEach((layer) => layer.setUniforms(uniforms));
  }

  code(functionName) {
    const inputs = this.layers[0].inputs;
    const outputs = this.layers[this.layers.length - 1].outputs;
    let code = this.layers.map((layer) => layer.code()).join("\n");
    code += `
    float[${outputs}] ${functionName}(float[${inputs}] inputCoeffs) {
        return ${this.layers
          .reverse()
          .map((layer) => `NN_LAYER_${layer.index}(`)
          .join("")}inputCoeffs${")".repeat(this.layers.length)};
    }
    `;
    return code;
  }

  static fromJSON(layers) {
    const net = new NeuralNet();
    layers.forEach((layer) => {
      net.addLayer(
        new NeuralLayer(layer.weights, layer.biases, layer.activation)
      );
    });
    return net;
  }
}
