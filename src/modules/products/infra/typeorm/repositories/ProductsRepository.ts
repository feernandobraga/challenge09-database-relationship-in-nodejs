import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';
import AppError from '@shared/errors/AppError';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = {
      name,
      price,
      quantity,
    };

    const newProduct = this.ormRepository.create(product);

    await this.ormRepository.save(newProduct);

    return newProduct;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productIds = products.map(product => product.id);

    const selectedProducts = await this.ormRepository.find({
      where: { id: In(productIds) },
    });

    if (selectedProducts.length < products.length) {
      throw new AppError(
        '@ProductsRepository - you entered an inexistent product',
      );
    }

    return selectedProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsInStock = await this.findAllById(products);

    productsInStock.map(ps => {
      const item = products.find(p => p.id === ps.id);

      if (!item) {
        throw new AppError('invalid product');
      }

      ps.quantity -= item.quantity;

      if (ps.quantity < 0) {
        throw new AppError('Not enough in stock');
      }

      // ps.quantity = item.quantity;
    });

    await this.ormRepository.save(productsInStock);

    return productsInStock;
  }
}

export default ProductsRepository;
