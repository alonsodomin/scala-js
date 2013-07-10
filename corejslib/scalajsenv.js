/* ---------------------------------- *
 * The top-level Scala.js environment *
 * ---------------------------------- */

function $ScalaJSEnvironmentClass(global) {
  // Fields
  this.global = global;
  this.primitives = {};
  this.classes = {};
  this.modules = {};
  this.natives = {};

  // Short fields used a lot by the codegen
  this.g = global; // Global scope
  this.c = {};     // Constructors
  this.m = {};     // Module instances

  // Core mechanism

  function defineLazyField(obj, propName, computeFun) {
    Object.defineProperty(obj, propName, {
      __proto__: null,
      enumerable: true,
      configurable: true,
      get: function() {
        var value = computeFun.call(obj);
        Object.defineProperty(obj, propName, {
          __proto__: null,
          enumerable: true,
          configurable: false,
          writable: false,
          value: value
        });
        return value;
      }
    });
  }

  this.createType = function(name, constructor, jsconstructor,
                             parent, ancestors, isPrimitive,
                             isInterface, isArray, componentData, zero,
                             arrayEncodedName, displayName) {
    var self = this;

    var data = {
      name: name,
      constructor: constructor,
      jsconstructor: jsconstructor,
      parent: parent,
      parentData: parent === null ? null : this.classes[parent],
      ancestors: ancestors,
      isPrimitive: isPrimitive,
      isInterface: isInterface,
      isArray: isArray,
      componentData: componentData,
      zero: zero,
      arrayEncodedName: arrayEncodedName,
      displayName: displayName,
      _class: undefined,
      get cls() {
        if (this._class === undefined)
          this._class = self.createClassInstance(this);
        return this._class;
      },
      _array: undefined,
      get array() {
        if (this._array === undefined)
          this._array = self.createArrayClass(this);
        return this._array;
      }
    };

    if (constructor !== undefined)
      constructor.prototype.$classData = data;

    if (!isPrimitive && !isArray) {
      Object.defineProperty(this.classes, name, {
        __proto__: null,
        enumerable: true,
        configurable: false,
        writable: false,
        value: data
      });
    } else if (isPrimitive) {
      Object.defineProperty(this.primitives, name, {
        __proto__: null,
        enumerable: true,
        configurable: false,
        writable: false,
        value: data
      });
    }

    return data;
  }

  this.createClass = function(name, constructor, jsconstructor,
                              parent, ancestors) {
    return this.createType(name, constructor, jsconstructor,
                           parent, ancestors,
                           false, false, false, null, null,
                           "L" + name + ";", name);
  };

  this.createPrimitiveType = function(name, zero, arrayEncodedName,
                                      displayName) {
    var ancestors = {};
    ancestors[name] = true;
    return this.createType(name, undefined, undefined,
                           null, ancestors,
                           true, false, false, null, zero,
                           arrayEncodedName, displayName);
  };

  this.createArrayClass = function(componentData) {
    var name = componentData.name + "[]";
    var encodedName = "[" + componentData.arrayEncodedName;
    var constructor = this.createArrayTypeFunction(name, componentData);

    var compAncestors = componentData.ancestors;
    var ancestors = {"java.lang.Object": true};
    for (var compAncestor in compAncestors)
      ancestors[compAncestor+"[]"] = true;

    return this.createType(name, constructor, constructor,
                           "java.lang.Object", ancestors,
                           false, false, true, componentData, null,
                           encodedName, encodedName);
  };

  this.createInterface = function(name, ancestors) {
    return this.createType(name, undefined, undefined,
                           null, ancestors,
                           false, true, false, null, null,
                           "L" + name + ";", name);
  };

  this.registerClass = function(name, propNameObj, createFunction) {
    var self = this;
    var propName = this.propertyName(propNameObj);
    Object.defineProperty(this.classes, name, {
      __proto__: null,
      enumerable: true,
      configurable: true,
      get: function() {
        createFunction(self); // hopefully this calls createClass(name) ...
        return this[name];    // ... otherwise this will recurse infinitely
      }
    });

    defineLazyField(this.c, propName, function() {
      return self.classes[name].constructor;
    });

    if (name !== propName) {
      defineLazyField(this.c, name, function() {
        return self.classes[name].constructor;
      });
    }
  }

  this.registerModule = function(name, propNameObj, className) {
    var self = this;
    var propName = this.propertyName(propNameObj);
    var data = {
      _instance: undefined,
      get instance() {
        if (this._instance === undefined)
          this._instance = new self.c[className]().init\ufe33\ufe34();
        return this._instance;
      }
    };
    this.modules[name] = data;

    defineLazyField(this.m, propName, function() {
      return self.modules[name].instance;
    });

    if (name !== propName) {
      defineLazyField(this.m, name, function() {
        return self.modules[name].instance;
      });
    }
  }

  this.createClassInstance = function(data) {
    // <init>(scala.js.Dynamic, scala.js.Dynamic)
    return new this.c["java.lang.Class"]()
      .init\uFE33\uFE34Lscala\uFE33js\uFE33Dynamic\uFE34Lscala\uFE33js\uFE33Dynamic(this, data);
  }

  this.registerNative = function(fullName, nativeFunction) {
    this.natives[fullName] = nativeFunction;
  }

  /** Encode a property name for runtime manipulation
   *  Usage:
   *    env.propertyName({someProp:0})
   *  Returns:
   *    "someProp"
   *  Useful when the property is renamed by a global optimizer (like Closure)
   *  but we must still get hold of a string of that name for runtime
   * reflection.
   */
  this.propertyName = function(obj) {
    var result;
    for (var prop in obj)
      result = prop;
    return result;
  }

  // Create primitive types

  this.createPrimitiveType("scala.Unit", undefined, "V", "void");
  this.createPrimitiveType("scala.Boolean", false, "Z", "boolean");
  this.createPrimitiveType("scala.Char", 0, "C", "char");
  this.createPrimitiveType("scala.Byte", 0, "B", "byte");
  this.createPrimitiveType("scala.Short", 0, "S", "short");
  this.createPrimitiveType("scala.Int", 0, "I", "int");
  this.createPrimitiveType("scala.Long", 0, "J", "long");
  this.createPrimitiveType("scala.Float", 0.0, "F", "float");
  this.createPrimitiveType("scala.Double", 0.0, "D", "double");

  // Create dummy class for java.lang.String

  this.registerClass("java.lang.String", {java\ufe33lang\ufe33String:0}, function($) {
    function StringClass() {
      throw "The pseudo StringClass constructor should never be called"
    }

    $.createClass("java.lang.String", StringClass, undefined, "java.lang.Object", {
      "java.lang.Object": true,
      "java.lang.String": true
    });
  });

  // Array type factory

  this.createArrayTypeFunction = function(name, componentData) {
    var ObjectClass = this.c["java.lang.Object"];
    var mangledName = componentData.name + "[]";

    function ArrayClass(arg) {
      ObjectClass.call(this);
      ObjectClass.prototype.init\ufe33\ufe34.call(this);

      if (typeof(arg) === "number") {
        // arg is the length of the array
        this.underlying = new Array(arg);
        zero = componentData.zero;
        for (var i = 0; i < arg; i++)
          this.underlying[i] = zero;
      } else {
        // arg is a native array that we wrap
        this.underlying = arg;
      }
    }
    ArrayClass.prototype = Object.create(ObjectClass.prototype);
    ArrayClass.prototype.constructor = ArrayClass;

    return ArrayClass;
  }

  // Runtime functions

  this.isScalaJSObject = function(instance) {
    return (typeof(instance) === "object") && (instance !== null) &&
      !!instance.$classData;
  }

  var StringAncestors = {
    "java.lang.String": true,
    "java.io.Serializable": true,
    "java.lang.CharSequence": true,
    "java.lang.Comparable": true,
    "java.lang.Object": true
  };

  this.isInstance = function(instance, classFullName) {
    if (this.isScalaJSObject(instance)) {
      return !!instance.$classData.ancestors[classFullName];
    } else if (typeof(instance) === "string") {
      return !!StringAncestors[classFullName];
    } else {
      return false;
    }
  };

  this.asInstance = function(instance, classFullName) {
    if ((instance === null) || this.isInstance(instance, classFullName))
      return instance;
    else
      this.throwClassCastException(instance, classFullName);
  };

  this.asInstanceString = function(instance) {
    if ((instance === null) || (typeof(instance) === "string"))
      return instance;
    else
      this.throwClassCastException(instance, "java.lang.String");
  };

  this.throwClassCastException = function(instance, classFullName) {
    throw new this.c["java.lang.ClassCastException"]().init\ufe33\ufe34T(
      instance + " is not an instance of " + classFullName);
  }

  this.makeNativeArrayWrapper = function(arrayClassData, nativeArray) {
    return new arrayClassData.constructor(nativeArray);
  }

  this.newArrayObject = function(arrayClassData, lengths) {
    return this.newArrayObjectInternal(arrayClassData, lengths, 0);
  };

  this.newArrayObjectInternal = function(arrayClassData, lengths, lengthIndex) {
    var result = new arrayClassData.constructor(lengths[lengthIndex]);

    if (lengthIndex < lengths.length-1) {
      var subArrayClassData = arrayClassData.componentData;
      var subLengthIndex = lengthIndex+1;
      for (var i = 0; i < result.length(); i++) {
        result.set(i, this.newArrayObjectInternal(
          subArrayClassData, lengths, subLengthIndex));
      }
    }

    return result;
  };

  this.anyEqEq = function(lhs, rhs) {
    if (this.isScalaJSObject(lhs)) {
      return this.m["scala.runtime.BoxesRunTime"].equals\ufe34O\ufe34O\ufe34Z(lhs, rhs);
    } else {
      return lhs === rhs;
    }
  }

  this.anyRefEqEq = function(lhs, rhs) {
    if (this.isScalaJSObject(lhs))
      return lhs.equals\ufe34O\ufe34Z(rhs);
    else
      return lhs === rhs;
  }

  this.objectGetClass = function(instance) {
    if (this.isScalaJSObject(instance) || (instance === null))
      return instance.getClass\ufe34java\ufe33lang\ufe33Class();
    else if (typeof(instance) === "string")
      return this.classes["java.lang.String"].cls;
    else
      return null; // Exception?
  }

  this.objectClone = function(instance) {
    // TODO
    throw new this.c["scala.NotImplementedError"]().init\ufe33\ufe34();
  }

  this.objectFinalize = function(instance) {
    // TODO?
  }

  this.objectNotify = function(instance) {
    // TODO?
  }

  this.objectNotifyAll = function(instance) {
    // TODO?
  }

  this.objectEquals = function(instance, rhs) {
    if (this.isScalaJSObject(instance) || (instance === null))
      return instance.equals\ufe34O\ufe34Z();
    else
      return instance === rhs;
  }

  this.objectHashCode = function(instance) {
    if (this.isScalaJSObject(instance))
      return instance.hashCode\ufe34I();
    else
      return 42; // TODO
  }

  this.truncateToLong = function(value) {
    return value < 0 ? Math.ceil(value) : Math.floor(value);
  }

  // Boxes - inline all the way through java.lang.X.valueOf()

  this.bV = function() {
    return this.m["scala.runtime.BoxedUnit"].$jsfield$UNIT;
  }
  this.bZ = function(value) {
    if (value)
      return this.m["java.lang.Boolean"].$jsfield$TRUE;
    else
      return this.m["java.lang.Boolean"].$jsfield$FALSE;
  }
  this.bC = function(value) {
    return new this.c["java.lang.Character"]().init\ufe33\ufe34C(value);
  }
  this.bB = function(value) {
    return new this.c["java.lang.Byte"]().init\ufe33\ufe34B(value);
  }
  this.bS = function(value) {
    return new this.c["java.lang.Short"]().init\ufe33\ufe34S(value);
  }
  this.bI = function(value) {
    return new this.c["java.lang.Integer"]().init\ufe33\ufe34I(value);
  }
  this.bJ = function(value) {
    return new this.c["java.lang.Long"]().init\ufe33\ufe34J(value);
  }
  this.bF = function(value) {
    return new this.c["java.lang.Float"]().init\ufe33\ufe34F(value);
  }
  this.bD = function(value) {
    return new this.c["java.lang.Double"]().init\ufe33\ufe34D(value);
  }

  // Unboxes - inline all the way through obj.xValue()

  this.uV = function(value) {
    return undefined;
  }
  this.uZ = function(value) {
    return this.asInstance(value, "java.lang.Boolean").$jsfield$value;
  }
  this.uC = function(value) {
    return this.asInstance(value, "java.lang.Character").$jsfield$value;
  }
  this.uB = function(value) {
    return this.asInstance(value, "java.lang.Byte").$jsfield$value;
  }
  this.uS = function(value) {
    return this.asInstance(value, "java.lang.Short").$jsfield$value;
  }
  this.uI = function(value) {
    return this.asInstance(value, "java.lang.Integer").$jsfield$value;
  }
  this.uJ = function(value) {
    return this.asInstance(value, "java.lang.Long").$jsfield$value;
  }
  this.uF = function(value) {
    return this.asInstance(value, "java.lang.Float").$jsfield$value;
  }
  this.uD = function(value) {
    return this.asInstance(value, "java.lang.Double").$jsfield$value;
  }
}

var $ScalaJSEnvironment = new $ScalaJSEnvironmentClass(this);
