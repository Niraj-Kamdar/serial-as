import { Serializer } from "@serial-as/core"
import { u128, u128Safe } from "as-bignum";
import * as base64 from "as-base64";


function escape_char(char: string): string {
  const charCode = char.charCodeAt(0);
  switch (charCode) {
    case 0x22: return '\\"';
    case 0x5C: return "\\\\";
    case 0x08: return "\\b";
    case 0x0A: return "\\n";
    case 0x0D: return "\\r";
    case 0x09: return "\\t";
    case 0x0C: return "\\f";
    case 0x0B: return "\\u000b";
    default: return char;
  }
}


export class JSONSerializer extends Serializer<string>{

  public starting_object: bool = true
  public inner_encode: string[] = []

  get_encoded_object(): string {
    return this.inner_encode.join('')
  }

  encode_field<K>(name: string, value: K): void {
    if (this.starting_object) {
      this.inner_encode.push("{")
    } else {
      this.inner_encode[this.inner_encode.length - 1] = ","
    }

    this.inner_encode.push(`"${name}":`)
    this.encode<K>(value)
    this.inner_encode.push("}")
    this.starting_object = false
  }

  // Bool --
  encode_bool(value: bool): void {
    this.inner_encode.push(value.toString())
  }

  // String --
  encode_string(value: string): void {

    let ret: Array<string> = new Array<string>(value.length)

    for(let i = 0; i < value.length; i++){
      ret[i] = escape_char(value.at(i))
    }
 
    this.inner_encode.push(`"${ret.join('')}"`)
  }

  // Array --
  encode_array<K extends ArrayLike<any>>(value: K): void {
    this.inner_encode.push(`[`)

    for (let i = 0; i < value.length; i++) {
      // @ts-ignore
      this.encode<valueof<K>>(value[i])
      if (i != value.length - 1) { this.inner_encode.push(`,`) }
    }

    this.inner_encode.push(`]`)
  }

  encode_arraybuffer(value:ArrayBuffer): void {
    this.encode_array<Uint8Array>(Uint8Array.wrap(value))   
  }

  encode_arraybuffer_view<T extends ArrayBufferView>(value:T): void {
    if (value instanceof Uint8Array) {
      this.inner_encode.push(`"${base64.encode(value)}"`)
    }else{
      this.encode_array<T>(value);
    }    
  }

  encode_static_array<T>(value:StaticArray<T>): void {
    this.encode_array<StaticArray<T>>(value);
  }

  // Null --
  encode_nullable<T>(t: T): void {
    if (t == null) {
      this.inner_encode.push("null");
    } else {
      // @ts-ignore
      this.encode<NonNullable<T>>(<NonNullable<T>>t);
    }
  }

  // Set --
  encode_set<T>(value: Set<T>): void {
    let values = value.values();
    this.inner_encode.push(`[`)
    for (let i = 0; i < values.length; i++) {
      this.encode<T>(values[i])
      if (i != values.length - 1) { this.inner_encode.push(`,`) }
    }
    this.inner_encode.push(`]`)
  }

  // Map --
  encode_map<K, V>(value: Map<K, V>): void {

    this.inner_encode.push(`{`)

    let keys = value.keys();

    for (let i = 0; i < keys.length; i++) {
      this.encode<K>(keys[i])
      this.inner_encode.push(':')
      this.encode<V>(value.get(keys[i]))

      if (i != keys.length - 1) { this.inner_encode.push(`,`) }
    }

    this.inner_encode.push(`}`)
  }

  // Object --
  encode_object<C extends object>(value: C): void {
    if (value instanceof u128 || value instanceof u128Safe) {
      this.encode_string(value.toString());
      return;
    }
    this.starting_object = true
    value.encode(this);
  }

  encode_u8(value: u8): void { this.inner_encode.push(value.toString()) }
  encode_i8(value: i8): void { this.inner_encode.push(value.toString()) }
  encode_u16(value: u16): void { this.inner_encode.push(value.toString()) }
  encode_i16(value: i16): void { this.inner_encode.push(value.toString()) }
  encode_u32(value: u32): void { this.inner_encode.push(value.toString()) }
  encode_i32(value: i32): void { this.inner_encode.push(value.toString()) }
  encode_u64(value: u64): void { this.inner_encode.push(`"${value.toString()}"`) }
  encode_i64(value: i64): void { this.inner_encode.push(`"${value.toString()}"`) }
  encode_f32(value: f32): void { this.inner_encode.push(value.toString()) }
  encode_f64(value: f64): void { this.inner_encode.push(value.toString()) }

  static encode<T>(value: T): String {
    const ser = new JSONSerializer();
    ser.encode(value);
    return ser.get_encoded_object();
  }
}