import { Injectable } from '@nestjs/common';

@Injectable()
export class FirebaseService {
  private readonly cats: any[] = [];
  private readonly 

  create(cat: any) {
    this.cats.push(cat);
  }

  findAll(): any[] {
    return this.cats;
  }
}